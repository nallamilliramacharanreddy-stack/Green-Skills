const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');

const generateTicketEmail = (ticket, user) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 1px; text-transform: uppercase;">
        SUPPORT TICKET RAISED
      </h1>
      <p style="color: #94a3b8; font-size: 11px; letter-spacing: 3px; margin-top: 8px; text-transform: uppercase;">Green Skill Platform</p>
    </div>
    <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">Ticket Information</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 120px; font-size: 13px;">Subject:</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${ticket.subject}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569; font-size: 13px;">Category:</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 13px;"><span style="background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; font-size: 11px;">${ticket.category}</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569; font-size: 13px;">Type:</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 13px; text-transform: capitalize;">${ticket.type}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569; font-size: 13px;">Priority:</td>
          <td style="padding: 8px 0; font-size: 13px;"><span style="color: ${ticket.priority === 'high' || ticket.priority === 'urgent' ? '#ef4444' : '#f59e0b'}; font-weight: bold; text-transform: uppercase;">${ticket.priority || 'medium'}</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569; font-size: 13px;">Raised By:</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${user ? user.name : 'Unknown User'} (${user ? user.email : 'No Email'})</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569; font-size: 13px;">Raised At:</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 13px;">${new Date(ticket.createdAt).toLocaleString()}</td>
        </tr>
      </table>

      <h3 style="color: #0f172a; font-size: 15px; margin-bottom: 8px;">Description</h3>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.6; font-size: 14px; white-space: pre-wrap;">${ticket.description}</div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <p style="color: #94a3b8; font-size: 12px; font-weight: 500;">© ${new Date().getFullYear()} Green Skill. All rights reserved.</p>
    </div>
  </div>
`;

exports.createTicket = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    const ticket = new Ticket({ ...req.body, user: userId });
    await ticket.save();

    // Fetch user details for email notification
    const user = await User.findById(userId);

    sendEmail({
      to: 'nallamilliramacharanreddy@gmail.com',
      subject: `[Support Ticket] ${ticket.subject}`,
      html: generateTicketEmail(ticket, user)
    }).catch((emailError) => {
      console.error('Failed to send support ticket email notification (handled asynchronously):', emailError);
    });

    // Emit real-time notification to admins
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_alerts').emit('receive_message', {
          message: `New Support Ticket raised: "${ticket.subject}" by ${user ? user.name : 'Unknown User'}`
        });
      }
    } catch (socketError) {
      console.error('Failed to emit real-time support ticket notification:', socketError);
    }

    // Save persistent notifications in the database for all admin & support users
    try {
      const admins = await User.find({ 
        role: { $in: ['admin', 'super-admin', 'support', 'admin_course', 'admin_hiring', 'admin_exam'] } 
      });
      for (const admin of admins) {
        await new Notification({
          user: admin._id,
          title: 'New Support Ticket',
          message: `New Support Ticket raised: "${ticket.subject}" by ${user ? user.name : 'Unknown User'}`,
          type: 'info',
          link: '/support'
        }).save();
      }
    } catch (dbNotifError) {
      console.error('Failed to save support ticket notification to database:', dbNotifError);
    }

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

exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    // Clean up notifications for this ticket from the database
    try {
      const Notification = require('../models/Notification');
      const escapedSubject = ticket.subject.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      await Notification.deleteMany({ message: { $regex: escapedSubject, $options: 'i' } });
    } catch (notifErr) {
      console.error('Failed to clean up notifications for deleted ticket:', notifErr);
    }

    // Emit real-time socket event to admins
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_alerts').emit('receive_message', {
          message: `Ticket unsent: "${ticket.subject}"`
        });
      }
    } catch (socketError) {
      console.error('Failed to emit real-time support ticket unsend notification:', socketError);
    }

    res.status(200).json({ success: true, message: 'Ticket unsent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
