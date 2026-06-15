const express = require('express');
const router = express.Router();
const { 
  createSession, 
  getSessionsForGuide, 
  getSessionsForStudent, 
  updateSessionStatus 
} = require('../controllers/mentorSessionController');

router.post('/', createSession);
router.get('/guide/:guideId', getSessionsForGuide);
router.get('/student/:studentId', getSessionsForStudent);
router.patch('/:id/status', updateSessionStatus);

module.exports = router;
