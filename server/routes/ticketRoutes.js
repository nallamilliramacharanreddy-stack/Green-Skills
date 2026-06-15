const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getUserTickets, 
  getAllTickets, 
  updateTicketStatus, 
  addTicketResponse 
} = require('../controllers/ticketController');

router.post('/', createTicket);
router.get('/user/:userId', getUserTickets);
router.get('/admin/all', getAllTickets);
router.patch('/:id/status', updateTicketStatus);
router.post('/:id/response', addTicketResponse);

module.exports = router;
