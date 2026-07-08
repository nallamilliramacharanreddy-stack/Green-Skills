const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const { 
  generateRoadmap, 
  calculateJobMatch, 
  getChatHistory, 
  sendMessage, 
  clearChatHistory, 
  generateResume,
  processResumeMatch
} = require('../controllers/aiController');
const router = express.Router();

router.post('/roadmap', generateRoadmap);
router.get('/match', calculateJobMatch);
router.get('/chat', getChatHistory);
router.post('/chat', sendMessage);
router.delete('/chat', clearChatHistory);
router.post('/chat/restore', require('../controllers/aiController').restoreChatHistory);
router.delete('/chat/message', require('../controllers/aiController').deleteIndividualMessage);
router.get('/chat/export', require('../controllers/aiController').exportChatHistory);
router.post('/resume', generateResume);

// New route for Resume Job Match
router.post('/resume-match', upload.single('resume'), processResumeMatch);

module.exports = router;
