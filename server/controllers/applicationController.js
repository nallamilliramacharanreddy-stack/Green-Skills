const Application = require('../models/Application');
const Job = require('../models/Job');

const applyForJob = async (req, res) => {
  try {
    const { jobId, studentId, employerId, resume, coverLetter } = req.body;
    
    // Check if already applied
    const existing = await Application.findOne({ jobId, studentId });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    const application = new Application({
      jobId,
      studentId,
      employerId,
      resume,
      coverLetter
    });

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting application' });
  }
};

const getEmployerApplications = async (req, res) => {
  try {
    const apps = await Application.find({ employerId: req.params.employerId })
      .populate('jobId')
      .populate('studentId', 'name email education profilePicture');
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    let app = await Application.findById(id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    app.status = status;
    
    if (req.body.interviewDate) app.interviewDate = req.body.interviewDate;
    if (req.body.joiningDate) app.joiningDate = req.body.joiningDate;

    await app.save();

    app = await Application.findById(id)
      .populate('jobId')
      .populate('studentId')
      .populate('employerId');

    const candidate = {
      name: app.studentId?.name || 'Candidate',
      email: app.studentId?.email,
      phone: app.studentId?.mobile || '',
      appliedRole: app.jobId?.title || 'the applied position'
    };

    const recruiter = {
      name: app.employerId?.name || 'Hiring Team',
      designation: app.employerId?.role || 'Recruiter',
      companyName: app.jobId?.companyName || (app.employerId?.companyDetails?.companyName || 'Our Company'),
      companyEmail: app.employerId?.email || ''
    };

    const applicationInfo = {
      status: app.status,
      interviewDate: app.interviewDate,
      joiningDate: app.joiningDate
    };

    let generated_subject = '';
    let generated_email_body = '';

    if (status.toUpperCase() === 'SHORTLISTED') {
      generated_subject = `Congratulations! You Have Been Shortlisted - ${recruiter.companyName}`;
      generated_email_body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin-bottom: 20px;">Application Update</h2>
          <p>Dear ${candidate.name},</p>
          <p>Congratulations! We are pleased to inform you that your profile has been <strong>shortlisted</strong> for the next stage of our competitive recruitment process for the <strong>${candidate.appliedRole}</strong> role at <strong>${recruiter.companyName}</strong>.</p>
          <p>Our hiring team was highly impressed by your skills, qualifications, and interview performance. We will follow up shortly with details regarding the next steps, including scheduling your interview or assessment.</p>
          <p>Thank you for choosing to pursue your career with ${recruiter.companyName}. We look forward to speaking with you soon.</p>
          <br>
          <p>Best regards,</p>
          <p><strong>${recruiter.name}</strong><br>
          ${recruiter.companyName}</p>
        </div>
      `;
    } else if (status.toUpperCase() === 'HIRED') {
      const formattedJoiningDate = applicationInfo.joiningDate 
        ? new Date(applicationInfo.joiningDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'shortly';
      generated_subject = `Welcome to ${recruiter.companyName} – Offer Confirmation`;
      generated_email_body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2da44e; margin-bottom: 20px;">Welcome to ${recruiter.companyName}!</h2>
          <p>Dear ${candidate.name},</p>
          <p>Congratulations! We are absolutely thrilled to offer you the position of <strong>${candidate.appliedRole}</strong> at <strong>${recruiter.companyName}</strong>. Following a highly competitive recruitment process, our team was incredibly impressed by your skills, experience, and potential to make a great impact.</p>
          <p>We are excited to welcome you to our organization, with your joining date scheduled for <strong>${formattedJoiningDate}</strong>.</p>
          <p>Our HR department will reach out shortly with onboarding details, compensation package details, and the necessary documentation for your review and signature.</p>
          <p>Thank you for choosing to build your career with ${recruiter.companyName}. We are excited about what we will achieve together!</p>
          <br>
          <p>Warmest welcome,</p>
          <p><strong>${recruiter.name}</strong><br>
          ${recruiter.companyName}</p>
        </div>
      `;
    }

    if (generated_subject && generated_email_body && candidate.email) {
      const { sendEmail } = require('../utils/emailService');
      await sendEmail({
        to: candidate.email,
        subject: generated_subject,
        html: generated_email_body
      });

      return res.json({
        to: candidate.email,
        subject: generated_subject,
        html: generated_email_body
      });
    }

    res.json(app);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

module.exports = { applyForJob, getEmployerApplications, updateApplicationStatus };
