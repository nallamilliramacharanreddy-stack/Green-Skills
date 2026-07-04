const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const fetch = require('node-fetch');

const geocodePincode = async (req, res) => {
  try {
    const { pincode, country = 'in' } = req.query; // default to India
    if (!pincode) return res.status(400).json({ message: 'Pincode is required' });

    // Using Nominatim API (OpenStreetMap) for free geocoding
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode)}&countrycodes=${encodeURIComponent(country)}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GreenSkillsPlatform/1.0'
      }
    });
    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Location not found for the given pincode' });
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    res.json({
      latitude: lat,
      longitude: lon,
      city: result.address.city || result.address.town || result.address.village,
      state: result.address.state,
      country: result.address.country,
      pincode: result.address.postcode || pincode
    });
  } catch (error) {
    console.error('Error in geocoding:', error);
    res.status(500).json({ message: 'Error performing geocoding' });
  }
};

const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude, trackingEnabled } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const updateData = {
      liveLocation: {
        type: 'Point',
        coordinates: [longitude, latitude] // GeoJSON format requires [long, lat]
      },
      lastLocationUpdatedAt: new Date(),
    };

    if (trackingEnabled !== undefined) {
      updateData.locationTrackingEnabled = trackingEnabled;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });

    // Log the update
    await AuditLog.create({
      userId: req.user._id,
      action: 'LOCATION_UPDATED',
      details: { coordinates: [longitude, latitude], trackingEnabled },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Location updated successfully', user });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
};

module.exports = { geocodePincode, updateUserLocation };
