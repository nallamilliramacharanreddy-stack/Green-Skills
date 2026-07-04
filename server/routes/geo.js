const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { geocodePincode, updateUserLocation } = require('../controllers/geoController');

// GET /api/geo/geocode?pincode=123456
router.get('/geocode', protect, geocodePincode);

// POST /api/geo/location
router.post('/location', protect, updateUserLocation);

module.exports = router;
