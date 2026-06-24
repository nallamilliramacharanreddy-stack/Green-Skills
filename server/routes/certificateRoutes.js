const express = require('express');
const { 
  createCertificate, 
  getUserCertificates, 
  getCertificatePdf, 
  getCertificateThumbnail,
  submitRegenRequest,
  getRegenRequests,
  decideRegenRequest
} = require('../controllers/certificateController');
const router = express.Router();

router.post('/', createCertificate);
router.get('/', getUserCertificates);
router.get('/pdf/:id', getCertificatePdf);
router.get('/thumbnail/:id', getCertificateThumbnail);
router.post('/regen-requests', submitRegenRequest);
router.get('/regen-requests', getRegenRequests);
router.post('/regen-requests/:id/decide', decideRegenRequest);

module.exports = router;
