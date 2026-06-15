const Review = require('../models/Review');

exports.createReview = async (req, res) => {
  try {
    const review = new Review({ ...req.body, reviewer: req.user.id });
    await review.save();
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ company: req.params.companyId }).populate('reviewer', 'name');
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
