const express = require('express');
const { getAllJobs, getNearbyJobs, createJob, approveJob, getEmployerJobs, getJobById, updateJob, deleteJob } = require('../controllers/jobController');
const router = express.Router();

router.get('/nearby', getNearbyJobs); // Make sure this is above /:id
router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.get('/employer/:employerId', getEmployerJobs);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);
router.patch('/:id/approve', approveJob);

module.exports = router;
