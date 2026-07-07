const GeoVacancy = require('../models/GeoVacancy');
const User = require('../models/User');

// Calculate distance between two coordinates in KM using Haversine Formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c; 
  return distance;
}

exports.createVacancy = async (req, res) => {
  try {
    const {
      hirerId, companyName, jobTitle, description, salary, 
      experience, jobType, skills, vacancies, address, city, 
      state, pincode, latitude, longitude
    } = req.body;

    const newVacancy = new GeoVacancy({
      hirerId,
      companyName,
      jobTitle,
      description,
      salary,
      experience,
      jobType,
      skills,
      vacancies,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      status: 'Active'
    });

    await newVacancy.save();
    res.status(201).json({ success: true, vacancy: newVacancy });
  } catch (error) {
    console.error('Error creating Geo Vacancy:', error);
    res.status(500).json({ success: false, message: 'Server error while creating vacancy' });
  }
};

exports.getHirerVacancies = async (req, res) => {
  try {
    const { hirerId } = req.params;
    const vacancies = await GeoVacancy.find({ hirerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, vacancies });
  } catch (error) {
    console.error('Error fetching hirer vacancies:', error);
    res.status(500).json({ success: false, message: 'Server error fetching vacancies' });
  }
};

exports.updateVacancyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const vacancy = await GeoVacancy.findByIdAndUpdate(id, { status }, { new: true });
    if (!vacancy) {
      return res.status(404).json({ success: false, message: 'Vacancy not found' });
    }

    res.status(200).json({ success: true, vacancy });
  } catch (error) {
    console.error('Error updating vacancy status:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

exports.deleteVacancy = async (req, res) => {
  try {
    const { id } = req.params;
    const vacancy = await GeoVacancy.findByIdAndDelete(id);
    if (!vacancy) {
      return res.status(404).json({ success: false, message: 'Vacancy not found' });
    }
    res.status(200).json({ success: true, message: 'Vacancy deleted successfully' });
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    res.status(500).json({ success: false, message: 'Server error deleting vacancy' });
  }
};

exports.getNearbyVacancies = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Fetch all active jobs. In a real-world massively scaled app, we would use $geoNear in MongoDB.
    // For exact Haversine implementation as requested, we fetch and calculate.
    const activeJobs = await GeoVacancy.find({ status: 'Active' })
      .populate('hirerId', 'profilePicture companyDetails');

    const MAX_DISTANCE_KM = 30;

    const nearbyJobs = activeJobs.map(job => {
      const dist = calculateDistance(userLat, userLng, job.latitude, job.longitude);
      return {
        ...job.toObject(),
        distance: dist
      };
    }).filter(job => job.distance <= MAX_DISTANCE_KM);

    // Sort by distance (nearest first)
    nearbyJobs.sort((a, b) => a.distance - b.distance);

    res.status(200).json({ success: true, jobs: nearbyJobs });
  } catch (error) {
    console.error('Error finding nearby vacancies:', error);
    res.status(500).json({ success: false, message: 'Server error finding nearby vacancies' });
  }
};
