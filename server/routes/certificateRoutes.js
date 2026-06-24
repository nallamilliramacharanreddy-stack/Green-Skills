const express = require('express');
const { createCertificate, getUserCertificates } = require('../controllers/certificateController');
const router = express.Router();

router.post('/', createCertificate);
router.get('/', getUserCertificates);

module.exports = router;
