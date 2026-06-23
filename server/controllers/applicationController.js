const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Result = require('../models/Result');

const applyForJob = async (req, res) => {
  try {
    const { jobId, studentId, employerId, resume, coverLetter } = req.body;
    
    // Check if already applied
    const existing = await Application.findOne({ jobId, studentId });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    const job = await Job.findById(jobId);
    const student = await User.findById(studentId);
    const employer = await User.findById(employerId);

    // Check if the student has already passed the exam linked to this job
    let autoShortlisted = false;
    let examResultData = undefined;
    if (job && job.examId) {
      const passedResult = await Result.findOne({
        user: studentId,
        quiz: job.examId,
        status: 'Pass'
      }).sort({ completedAt: -1 });

      if (passedResult) {
        autoShortlisted = true;
        examResultData = {
          score: passedResult.score,
          totalQuestions: passedResult.totalQuestions,
          completedAt: passedResult.completedAt || new Date()
        };
      }
    }

    const application = new Application({
      jobId,
      studentId,
      employerId,
      resume,
      coverLetter,
      status: autoShortlisted ? 'shortlisted' : 'pending',
      ...(examResultData && { examResult: examResultData })
    });

    await application.save();

    // Trigger recruiter notifications (database notification and email)
    if (student && employer && job) {
      const Notification = require('../models/Notification');
      const { sendEmail } = require('../utils/emailService');

      const notifTitle = autoShortlisted
        ? `Shortlisted Applicant: ${student.name} (Exam Cleared)`
        : 'New Application Received';
      const notifMsg = autoShortlisted
        ? `${student.name} has applied AND cleared your exam for "${job.title}". They are automatically shortlisted!`
        : `${student.name} has applied for your job opening: "${job.title}"`;      
      
      // Save database notification for the recruiter
      try {
        await new Notification({
          user: employerId,
          title: notifTitle,
          message: notifMsg,
          type: autoShortlisted ? 'success' : 'info',
          link: '/employer/applications'
        }).save();
      } catch (dbErr) {
        console.error('Failed to save application notification to database:', dbErr);
      }

      // Send email notification to recruiter
      const subject = autoShortlisted
        ? `🏆 Exam-Cleared Applicant: ${student.name} – ${job.title}`
        : `New Job Application: ${student.name} - ${job.title}`;

      const examScoreLine = examResultData
        ? `<li><strong>Exam Score:</strong> ${examResultData.score}/${examResultData.totalQuestions} (${Math.round((examResultData.score / examResultData.totalQuestions) * 100)}%)</li>`
        : '';

      const autoShortlistBanner = autoShortlisted
        ? `<div style="background-color:#d4edda;border-left:4px solid #28a745;padding:12px 16px;margin:16px 0;border-radius:4px;">
            <strong style="color:#155724;">✅ Auto-Shortlisted:</strong> <span style="color:#155724;">This candidate has already passed your screening exam and has been automatically shortlisted. Schedule their interview from your dashboard.</span>
           </div>`
        : '';

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin-bottom: 20px;">${autoShortlisted ? '🏆 Exam-Cleared Applicant' : 'New Job Application'}</h2>
          <p>Dear ${employer.name || 'Hiring Team'},</p>
          <p>A candidate has applied for your job opening: <strong>${job.title}</strong>.</p>
          ${autoShortlistBanner}
          <p><strong>Candidate Details:</strong></p>
          <ul>
            <li><strong>Name:</strong> ${student.name}</li>
            <li><strong>Email:</strong> ${student.email}</li>
            <li><strong>Education:</strong> ${student.education || 'N/A'}</li>
            ${examScoreLine}
          </ul>
          <p>Please log in to your dashboard to schedule an interview with this candidate.</p>
          <br>
          <p>Best regards,</p>
          <p><strong>Green Skills Recruitment Portal</strong></p>
        </div>
      `;
      try {
        await sendEmail({ to: employer.email, subject, html });
      } catch (emailErr) {
        console.error('Failed to send application email notification to recruiter:', emailErr);
      }

      // If auto-shortlisted, also notify the student
      if (autoShortlisted) {
        try {
          await new Notification({
            user: studentId,
            title: '🎉 You Are Shortlisted!',
            message: `Congratulations! You have been automatically shortlisted for "${job.title}" at ${job.companyName} because you cleared their screening exam. Watch for an interview invite!`,
            type: 'success',
            link: '/dashboard/hiring'
          }).save();
        } catch (notifErr) {
          console.error('Failed to save auto-shortlist student notification:', notifErr);
        }
      }

      // Emit real-time message via socket
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${employerId.toString()}`).emit('receive_message', {
          message: notifMsg
        });
      }
    }

    res.status(201).json({
      message: autoShortlisted
        ? 'Application submitted! You have been automatically shortlisted because you passed the screening exam.'
        : 'Application submitted successfully!',
      autoShortlisted
    });
  } catch (error) {
    console.error('Error submitting application:', error);
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
    const { status, scheduleInterviewOnly } = req.body;
    
    let app = await Application.findById(id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // If the recruiter is just scheduling/rescheduling an interview for an already-shortlisted candidate
    // (i.e., scheduleInterviewOnly flag is set, or the candidate is already shortlisted and status is still shortlisted)
    const isSchedulingInterview = scheduleInterviewOnly ||
      (app.status === 'shortlisted' && status === 'shortlisted');

    app.status = status;
    
    if (req.body.interviewDate) app.interviewDate = req.body.interviewDate;
    if (req.body.interviewLink) app.interviewLink = req.body.interviewLink;
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
      interviewLink: app.interviewLink,
      joiningDate: app.joiningDate
    };

    let generated_subject = '';
    let generated_email_body = '';

    if (status.toUpperCase() === 'SHORTLISTED') {
      const formattedInterviewDate = app.interviewDate 
        ? new Date(app.interviewDate).toLocaleString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'to be announced';
      const linkHtml = app.interviewLink 
        ? `<p><strong>Virtual Interview Link:</strong> <a href="${app.interviewLink}" style="color: #1a73e8; font-weight: bold; text-decoration: underline;" target="_blank">${app.interviewLink}</a></p>`
        : '<p>Our team will share the virtual meeting details shortly.</p>';

      // Check if an interview date has been set — if so, use interview-specific subject
      const hasInterviewScheduled = !!app.interviewDate;

      if (hasInterviewScheduled) {
        // Email for interview scheduling / rescheduling
        generated_subject = isSchedulingInterview
          ? `📅 Interview Scheduled: ${candidate.appliedRole} at ${recruiter.companyName}`
          : `Congratulations! You Have Been Shortlisted - ${recruiter.companyName}`;

        generated_email_body = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1a73e8; margin-bottom: 20px;">📅 Interview Scheduled</h2>
            <p>Dear ${candidate.name},</p>
            <p>${isSchedulingInterview
              ? `We are pleased to inform you that your interview for the <strong>${candidate.appliedRole}</strong> position at <strong>${recruiter.companyName}</strong> has been scheduled.`
              : `Congratulations! You have been <strong>shortlisted</strong> for the <strong>${candidate.appliedRole}</strong> role at <strong>${recruiter.companyName}</strong> and your interview has been scheduled.`
            }</p>
            <div style="background-color: #f0f4ff; border-left: 4px solid #1a73e8; padding: 20px; margin: 20px 0; border-radius: 6px;">
              <h4 style="margin: 0 0 12px 0; color: #1a73e8; font-size: 16px;">🗓 Interview Details</h4>
              <table style="width:100%; border-collapse:collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555; width: 160px;">📅 Date &amp; Time:</td>
                  <td style="padding: 6px 0; color: #222; font-weight: bold;">${formattedInterviewDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555;">💼 Role:</td>
                  <td style="padding: 6px 0; color: #222;">${candidate.appliedRole}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555;">🏢 Company:</td>
                  <td style="padding: 6px 0; color: #222;">${recruiter.companyName}</td>
                </tr>
              </table>
              <div style="margin-top: 14px;">${linkHtml}</div>
            </div>
            <p><strong>Tips for a great interview:</strong></p>
            <ul style="color:#555;">
              <li>Ensure your webcam and microphone are working before the call.</li>
              <li>Join from a quiet, well-lit space.</li>
              <li>Have a copy of your resume ready.</li>
              <li>Be 5 minutes early to the virtual meeting.</li>
            </ul>
            <p>We look forward to speaking with you. Best of luck!</p>
            <br>
            <p>Best regards,</p>
            <p><strong>${recruiter.name}</strong><br/>${recruiter.companyName}</p>
          </div>
        `;
      } else {
        // Shortlisted without an interview date yet
        generated_subject = `Congratulations! You Have Been Shortlisted - ${recruiter.companyName}`;
        generated_email_body = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1a73e8; margin-bottom: 20px;">Application Shortlisted</h2>
            <p>Dear ${candidate.name},</p>
            <p>Congratulations! We are pleased to inform you that your profile has been <strong>shortlisted</strong> for a virtual interview for the <strong>${candidate.appliedRole}</strong> role at <strong>${recruiter.companyName}</strong>.</p>
            <p>Our team will reach out shortly with the interview schedule and virtual meeting details.</p>
            <p>Thank you for your interest in ${recruiter.companyName}. We look forward to connecting with you soon!</p>
            <br>
            <p>Best regards,</p>
            <p><strong>${recruiter.name}</strong><br/>${recruiter.companyName}</p>
          </div>
        `;
      }

      // Create a DB notification for the candidate
      const Notification = require('../models/Notification');
      const notifMessage = app.interviewDate
        ? `Your interview for ${candidate.appliedRole} at ${recruiter.companyName} is scheduled on ${formattedInterviewDate}. Check your email for the meeting link.`
        : `Congratulations! You have been shortlisted for ${candidate.appliedRole} at ${recruiter.companyName}. Watch for your interview schedule!`;
      try {
        await new Notification({
          user: app.studentId?._id,
          title: app.interviewDate ? '📅 Interview Scheduled!' : 'Application Shortlisted',
          message: notifMessage,
          type: 'success',
          link: '/dashboard/profile'
        }).save();
      } catch (notifErr) {
        console.error('Failed to save shortlisted/interview notification to database:', notifErr);
      }
    } else if (status.toUpperCase() === 'HIRED') {
      const formattedJoiningDate = applicationInfo.joiningDate 
        ? new Date(applicationInfo.joiningDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
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

      // Create a DB notification for the candidate about being hired
      const Notification = require('../models/Notification');
      try {
        await new Notification({
          user: app.studentId?._id,
          title: 'Hired Successfully!',
          message: `Welcome to ${recruiter.companyName}! You have been selected for the role of ${candidate.appliedRole}. Joining Date: ${formattedJoiningDate}.`,
          type: 'success',
          link: '/dashboard/profile'
        }).save();
      } catch (notifErr) {
        console.error('Failed to save hired notification to database:', notifErr);
      }
    }

    if (generated_subject && generated_email_body && candidate.email) {
      const { sendEmail } = require('../utils/emailService');
      try {
        await sendEmail({
          to: candidate.email,
          subject: generated_subject,
          html: generated_email_body
        });
      } catch (emailErr) {
        console.error('Failed to send status update email:', emailErr);
      }

      return res.json({
        to: candidate.email,
        subject: generated_subject,
        html: generated_email_body,
        app
      });
    }

    res.json(app);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

module.exports = { applyForJob, getEmployerApplications, updateApplicationStatus };
