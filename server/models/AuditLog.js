const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'LOCATION_UPDATED', 'GPS_PERMISSION_GRANTED'
  details: { type: mongoose.Schema.Types.Mixed }, // flexible details like coordinates, old location, etc.
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
