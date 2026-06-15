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
    const app = await Application.findByIdAndUpdate(id, { status }, { new: true });
    res.json(app);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
};

module.exports = { applyForJob, getEmployerApplications, updateApplicationStatus };
