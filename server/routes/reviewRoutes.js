const express = require('express');
const router = express.Router();
const { createReview, getCompanyReviews } = require('../controllers/reviewController');

router.post('/', createReview);
router.get('/:companyId', getCompanyReviews);

module.exports = router;
