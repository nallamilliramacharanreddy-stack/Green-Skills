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

    let jobs;
    try {
      jobs = await Job.aggregate(pipeline);
    } catch (aggError) {
      console.warn('GeoNear aggregation failed (likely missing 2dsphere index). Falling back to JS calculation.', aggError);
      
      // Fallback: fetch all jobs and calculate in JS
      const allJobs = await Job.find().lean();
      
      jobs = allJobs.map(job => {
        if (!job.geoLocation || !job.geoLocation.coordinates || job.geoLocation.coordinates.length < 2) {
          return null;
        }
        
        const jobLng = job.geoLocation.coordinates[0];
        const jobLat = job.geoLocation.coordinates[1];
        
        // Haversine formula
        const R = 6371e3; // metres
        const φ1 = latitude * Math.PI/180;
        const φ2 = jobLat * Math.PI/180;
        const Δφ = (jobLat-latitude) * Math.PI/180;
        const Δλ = (jobLng-longitude) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        if (distance > distanceLimit) return null;
        
        return {
          ...job,
          calculatedDistance: distance,
          matchScore: 0 // Simplistic fallback
        };
      }).filter(Boolean);

      // Sort by distance
      jobs.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    }
    
    // Populate postedBy after aggregation or fallback
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
