const express = require('express');
const router = express.Router();
const streakController = require('../controllers/streakController');

router.post('/continue', streakController.continueStreak);
router.get('/leaderboard', streakController.getLeaderboard);
router.get('/me', streakController.getMyStreak);

module.exports = router;
