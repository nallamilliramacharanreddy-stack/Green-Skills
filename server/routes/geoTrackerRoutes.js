const express = require('express');
const router = express.Router();
const geoTrackerController = require('../controllers/geoTrackerController');
// Assuming standard authentication middleware is used in this app. 
// If it has protect middleware, we can import it, but for now we define the routes.

// Base path: /api/geo-tracker

// Public or User-facing route to get nearby jobs
router.get('/nearby', geoTrackerController.getNearbyVacancies);

// Hirer routes
router.post('/', geoTrackerController.createVacancy);
router.get('/hirer/:hirerId', geoTrackerController.getHirerVacancies);
router.put('/:id/status', geoTrackerController.updateVacancyStatus);
router.delete('/:id', geoTrackerController.deleteVacancy);

module.exports = router;
