const Job = require('../models/Job');

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
};

const createJob = async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      postedBy: req.body.postedBy // This will be passed from frontend (user._id)
    });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error creating job' });
  }
};

const getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.params.employerId });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employer jobs' });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('examId');
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job details' });
  }
};

const approveJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error approving job' });
  }
};

module.exports = { getAllJobs, createJob, approveJob, getEmployerJobs, getJobById };
