const fs = require('fs');
const path = require('path');
const Certificate = require('../models/Certificate');

exports.createCertificate = async (req, res) => {
  try {
    const { certificateId, userId, candidateName, courseName, issueDate, pdfBase64, thumbnailBase64 } = req.body;

    if (!certificateId || !userId || !candidateName || !courseName || !issueDate || !pdfBase64 || !thumbnailBase64) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Name integrity rule check
    const expectedName = "NALLAMILLI RAMA CHARAN REDDY";
    const sanitizedCandidateName = candidateName.trim();
    if (sanitizedCandidateName.toUpperCase() === expectedName) {
      // Enforce the exact case and spelling
      if (sanitizedCandidateName !== expectedName) {
        return res.status(400).json({ message: `Name integrity violation. Name must be exactly: ${expectedName}` });
      }
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save PDF (robustly strip the data URI prefix regardless of jsPDF formatting)
    const pdfData = pdfBase64.includes(';base64,') ? pdfBase64.split(';base64,').pop() : pdfBase64;
    const pdfFilename = `cert-${certificateId}-${Date.now()}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFilename);
    try {
      fs.writeFileSync(pdfPath, Buffer.from(pdfData, 'base64'));
    } catch (fsErr) {
      console.error("Local disk PDF write failed (will rely on MongoDB):", fsErr);
    }

    // Save Thumbnail Image (robustly strip the data URI prefix)
    const imgData = thumbnailBase64.includes(';base64,') ? thumbnailBase64.split(';base64,').pop() : thumbnailBase64;
    const imgFilename = `thumb-${certificateId}-${Date.now()}.jpg`;
    const imgPath = path.join(uploadsDir, imgFilename);
    try {
      fs.writeFileSync(imgPath, Buffer.from(imgData, 'base64'));
    } catch (fsErr) {
      console.error("Local disk thumbnail write failed (will rely on MongoDB):", fsErr);
    }

    // Dynamic database-backed URL endpoints
    const pdfUrl = `/api/certificates/pdf/${certificateId}`;
    const thumbnailUrl = `/api/certificates/thumbnail/${certificateId}`;

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ certificateId });
    if (certificate) {
      return res.status(400).json({ message: "Certificate already exists" });
    }

    certificate = new Certificate({
      certificateId,
      userId,
      candidateName,
      courseName,
      issueDate,
      pdfUrl,
      thumbnailUrl,
      pdfData: pdfData,
      thumbnailData: imgData
    });

    await certificate.save();
    return res.status(201).json({ message: "Certificate saved successfully", certificate });
  } catch (error) {
    console.error("Create certificate error:", error);
    return res.status(500).json({ message: error.message || "Failed to create certificate" });
  }
};

exports.getUserCertificates = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId query parameter is required" });
    }

    // Fetch user certificates
    const certificates = await Certificate.find({ userId }).sort({ createdAt: -1 });
    
    // Self-healing: Clean up legacy records if the physical files got deleted from Render disk
    const verifiedCertificates = [];
    for (const cert of certificates) {
      if (cert.pdfUrl && cert.pdfUrl.startsWith('/uploads/') && !cert.pdfData) {
        const filePath = path.join(__dirname, '..', cert.pdfUrl);
        if (!fs.existsSync(filePath)) {
          // File is missing, delete the broken DB record to allow regeneration
          await Certificate.deleteOne({ _id: cert._id });
          continue;
        }
      }
      verifiedCertificates.push(cert);
    }

    return res.status(200).json(verifiedCertificates);
  } catch (error) {
    console.error("Get certificates error:", error);
    return res.status(500).json({ message: "Failed to load certificates" });
  }
};

exports.getCertificatePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOne({ certificateId: id });
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    if (cert.pdfData) {
      const pdfBuffer = Buffer.from(cert.pdfData, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${cert.certificateId}.pdf"`);
      return res.send(pdfBuffer);
    }

    // Fallback to local file if base64 data is missing (for legacy certs)
    const legacyPath = path.join(__dirname, '..', cert.pdfUrl);
    if (fs.existsSync(legacyPath)) {
      const fileStream = fs.createReadStream(legacyPath);
      res.setHeader('Content-Type', 'application/pdf');
      return fileStream.pipe(res);
    }

    return res.status(404).json({ message: "Certificate PDF file not found" });
  } catch (error) {
    console.error("Error serving certificate PDF:", error);
    return res.status(500).json({ message: "Failed to serve PDF" });
  }
};

exports.getCertificateThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOne({ certificateId: id });
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    if (cert.thumbnailData) {
      const imgBuffer = Buffer.from(cert.thumbnailData, 'base64');
      res.setHeader('Content-Type', 'image/jpeg');
      return res.send(imgBuffer);
    }

    // Fallback to local file for legacy certs
    const legacyPath = path.join(__dirname, '..', cert.thumbnailUrl);
    if (fs.existsSync(legacyPath)) {
      const fileStream = fs.createReadStream(legacyPath);
      res.setHeader('Content-Type', 'image/jpeg');
      return fileStream.pipe(res);
    }

    return res.status(404).json({ message: "Certificate thumbnail not found" });
  } catch (error) {
    console.error("Error serving certificate thumbnail:", error);
    return res.status(500).json({ message: "Failed to serve thumbnail" });
  }
};
