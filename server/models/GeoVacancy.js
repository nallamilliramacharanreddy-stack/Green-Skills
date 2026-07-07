const mongoose = require('mongoose');

const geoVacancySchema = new mongoose.Schema({
  hirerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  description: { type: String, required: true },
  salary: { type: String },
  experience: { type: String },
  jobType: { type: String },
  skills: [{ type: String }],
  vacancies: { type: Number, default: 1 },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  pincode: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

// Optionally, a geospatial index for more advanced mongo queries (we will use manual haversine in controller for simplicity/compatibility)
geoVacancySchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('GeoVacancy', geoVacancySchema);
