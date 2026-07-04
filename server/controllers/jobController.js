const Job = require('../models/Job');

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name email profilePicture').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
};

const getNearbyJobs = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 50000, skills = '' } = req.query; // maxDistance in meters (default 50km)
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const distanceLimit = parseInt(maxDistance, 10);
    const skillsArray = skills ? skills.split(',').map(s => s.trim().toLowerCase()) : [];

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'calculatedDistance',
          maxDistance: distanceLimit,
          spherical: true
        }
      }
    ];

    // If skills are provided, calculate a matching score
    if (skillsArray.length > 0) {
      pipeline.push({
        $addFields: {
          matchScore: {
            $size: {
              $setIntersection: [
                {
                  $map: {
                    input: { $ifNull: ['$requiredSkills', []] },
                    as: 'skill',
                    in: { $toLower: '$$skill' }
                  }
                },
                skillsArray
              ]
            }
          }
        }
      });
      // Sort by matchScore descending, then by distance ascending
      pipeline.push({ $sort: { matchScore: -1, calculatedDistance: 1 } });
    }

    const jobs = await Job.aggregate(pipeline);
    
    // Populate postedBy after aggregation
    await Job.populate(jobs, { path: 'postedBy', select: 'name email profilePicture' });

    res.json(jobs);
  } catch (error) {
    console.error('Error in getNearbyJobs:', error);
    res.status(500).json({ message: 'Error fetching nearby jobs' });
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

const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error updating job' });
  }
};

const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job' });
  }
};

module.exports = { getAllJobs, getNearbyJobs, createJob, approveJob, getEmployerJobs, getJobById, updateJob, deleteJob };
