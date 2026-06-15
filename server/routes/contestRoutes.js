const express = require('express');
const router = express.Router();
const { createContest, getContests } = require('../controllers/contestController');

router.post('/', createContest);
router.get('/', getContests);

module.exports = router;
