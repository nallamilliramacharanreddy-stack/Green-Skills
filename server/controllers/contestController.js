const Contest = require('../models/Contest');

exports.createContest = async (req, res) => {
  try {
    const contest = new Contest(req.body);
    await contest.save();
    res.status(201).json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContests = async (req, res) => {
  try {
    const contests = await Contest.find().sort({ startTime: 1 });
    res.status(200).json({ success: true, contests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
