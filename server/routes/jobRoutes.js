const express = require('express');
const { getAllJobs, createJob, approveJob, getEmployerJobs, getJobById } = require('../controllers/jobController');
const router = express.Router();

router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.get('/employer/:employerId', getEmployerJobs);
router.post('/', createJob);
router.patch('/:id/approve', approveJob);

module.exports = router;
