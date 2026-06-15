const express = require('express');
const { 
  generateRoadmap, 
  calculateJobMatch, 
  getChatHistory, 
  sendMessage, 
  clearChatHistory, 
  generateResume 
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

module.exports = router;
