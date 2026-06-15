const Roadmap = require('../models/Roadmap');
const User = require('../models/User');

exports.generateRoadmap = async (req, res) => {
  try {
    const { userId, careerGoal } = req.body;
    
    // Mock AI Logic - In a real app this would call an LLM API
    const roadmap = new Roadmap({
      user: userId,
      careerGoal,
      currentSkills: ['Basic Electrical'],
      targetSkills: ['Solar PV Design', 'Grid Integration'],
      readinessScore: 30,
      milestones: [
        { title: 'Foundations of Solar', timeline: 'Month 1-2', status: 'active' },
        { title: 'Advanced PV Systems', timeline: 'Month 3-4', status: 'locked' }
      ],
      greenJobPaths: [
        { title: 'Junior Solar Engineer', matchPercentage: 85 }
      ]
    });

    await roadmap.save();
    res.status(201).json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ user: req.params.userId });
    if (!roadmap) return res.status(404).json({ success: false, message: 'No roadmap found' });
    res.status(200).json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
