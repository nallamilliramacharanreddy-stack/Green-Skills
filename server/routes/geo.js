const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { geocodePincode, updateUserLocation } = require('../controllers/geoController');

// GET /api/geo/geocode?pincode=123456
router.get('/geocode', auth, geocodePincode);

// POST /api/geo/location
router.post('/location', auth, updateUserLocation);

module.exports = router;
