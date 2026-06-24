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
    fs.writeFileSync(pdfPath, Buffer.from(pdfData, 'base64'));

    // Save Thumbnail Image (robustly strip the data URI prefix)
    const imgData = thumbnailBase64.includes(';base64,') ? thumbnailBase64.split(';base64,').pop() : thumbnailBase64;
    const imgFilename = `thumb-${certificateId}-${Date.now()}.jpg`;
    const imgPath = path.join(uploadsDir, imgFilename);
    fs.writeFileSync(imgPath, Buffer.from(imgData, 'base64'));

    const pdfUrl = `/uploads/${pdfFilename}`;
    const thumbnailUrl = `/uploads/${imgFilename}`;

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
      thumbnailUrl
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
    return res.status(200).json(certificates);
  } catch (error) {
    console.error("Get certificates error:", error);
    return res.status(500).json({ message: "Failed to load certificates" });
  }
};
