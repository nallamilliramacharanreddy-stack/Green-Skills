const express = require('express');
const { applyForJob, getEmployerApplications, updateApplicationStatus, getStudentApplications, applyForGeoVacancy } = require('../controllers/applicationController');
const router = express.Router();

router.post('/apply', applyForJob);
router.post('/geo-apply', applyForGeoVacancy);
router.get('/employer/:employerId', getEmployerApplications);
router.get('/student/:studentId', getStudentApplications);
router.patch('/:id/status', updateApplicationStatus);

module.exports = router;
