const express = require('express');
const router = express.Router();
const { generateRoadmap, getRoadmap } = require('../controllers/roadmapController');

router.post('/generate', generateRoadmap);
router.get('/:userId', getRoadmap);

module.exports = router;
