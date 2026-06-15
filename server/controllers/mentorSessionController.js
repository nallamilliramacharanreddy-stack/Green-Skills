const MentorSession = require('../models/MentorSession');
const User = require('../models/User');

exports.createSession = async (req, res) => {
  try {
    const { mentor, student, scheduledAt, topic, meetingLink, notes } = req.body;
    
    // Verify user existences
    const mentorUser = await User.findById(mentor);
    const studentUser = await User.findById(student);
    
    if (!mentorUser || !studentUser) {
      return res.status(404).json({ success: false, message: 'Mentor or Student not found' });
    }
    
    const session = new MentorSession({
      mentor,
      student,
      scheduledAt,
      topic,
      meetingLink: meetingLink || 'https://meet.google.com/abc-defg-hij',
      notes
    });
    
    await session.save();
    
    // Populate before sending back
    const populated = await MentorSession.findById(session._id)
      .populate('mentor', 'name email')
      .populate('student', 'name email');
      
    res.status(201).json({ success: true, session: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSessionsForGuide = async (req, res) => {
  try {
    const { guideId } = req.params;
    const sessions = await MentorSession.find({ mentor: guideId })
      .populate('student', 'name email')
      .populate('mentor', 'name email')
      .sort({ scheduledAt: 1 });
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSessionsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const sessions = await MentorSession.find({ student: studentId })
      .populate('mentor', 'name email')
      .sort({ scheduledAt: 1 });
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    const updateFields = {};
    if (status) updateFields.status = status;
    if (feedback) updateFields.feedback = feedback;
    
    const session = await MentorSession.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate('student', 'name email').populate('mentor', 'name email');
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
