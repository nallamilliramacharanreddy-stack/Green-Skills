const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  requirements: [String],
  requiredSkills: [String],
  location: String,
  salary: String,
  image: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  
  // -- GEO LOCATION TRACKING --
  geoLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  address: String,
  city: String,
  state: String,
  country: String,
  pincode: String,
  timezone: String,
  locationSource: { type: String, enum: ['gps', 'pincode', 'manual', 'unknown'], default: 'unknown' },
  gpsAccuracy: Number,
  lastVerifiedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

// Create geospatial index for 2dsphere queries (like Haversine distance calculations)
jobSchema.index({ geoLocation: '2dsphere' });

module.exports = mongoose.model('Job', jobSchema);
