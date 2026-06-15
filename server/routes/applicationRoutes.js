const express = require('express');
const { applyForJob, getEmployerApplications, updateApplicationStatus } = require('../controllers/applicationController');
const router = express.Router();

router.post('/apply', applyForJob);
router.get('/employer/:employerId', getEmployerApplications);
router.patch('/:id/status', updateApplicationStatus);

module.exports = router;
