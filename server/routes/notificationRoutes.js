const express = require('express');
const router = express.Router();
const { 
  getUserNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  clearAllNotifications 
} = require('../controllers/notificationController');

router.get('/user/:userId', getUserNotifications);
router.patch('/:id/read', markNotificationRead);
router.patch('/user/:userId/read-all', markAllNotificationsRead);
router.delete('/user/:userId/clear-all', clearAllNotifications);

module.exports = router;
