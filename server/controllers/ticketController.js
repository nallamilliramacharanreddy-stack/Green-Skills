const Ticket = require('../models/Ticket');

exports.createTicket = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    const ticket = new Ticket({ ...req.body, user: userId });
    await ticket.save();
    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.params.userId })
      .populate('responses.responder', 'name role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('user', 'name email')
      .populate('responses.responder', 'name role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true })
      .populate('user', 'name email')
      .populate('responses.responder', 'name role');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addTicketResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { responder, message } = req.body;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    ticket.responses.push({ responder, message });
    ticket.updatedAt = Date.now();
    await ticket.save();

    const populated = await Ticket.findById(id)
      .populate('user', 'name email')
      .populate('responses.responder', 'name role');
    res.status(200).json({ success: true, ticket: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
