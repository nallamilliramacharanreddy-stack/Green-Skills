const express = require('express');
const { createCertificate, getUserCertificates, getCertificatePdf, getCertificateThumbnail } = require('../controllers/certificateController');
const router = express.Router();

router.post('/', createCertificate);
router.get('/', getUserCertificates);
router.get('/pdf/:id', getCertificatePdf);
router.get('/thumbnail/:id', getCertificateThumbnail);

module.exports = router;
