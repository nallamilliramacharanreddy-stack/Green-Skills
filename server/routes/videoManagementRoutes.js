const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo
} = require('../controllers/videoController');

// Multer filter to accept only mp4, mov, avi, webm
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.mp4', '.mov', '.avi', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only mp4, mov, avi, and webm are allowed.'), false);
  }
};

// Set up multer for temporary storage in the OS tmp directory
const upload = multer({
  dest: os.tmpdir(),
  fileFilter: fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB size limit
});

// Wrapper middleware to catch Multer errors gracefully
const uploadSingleVideo = (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds the 500MB limit.' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Admin video routes (requires authentication and admin permissions)
router.post('/admin/videos/upload', protect, adminOnly, uploadSingleVideo, uploadVideo);
router.put('/admin/videos/:id', protect, adminOnly, uploadSingleVideo, updateVideo);
router.delete('/admin/videos/:id', protect, adminOnly, deleteVideo);

// Public/User video routes (requires authentication)
router.get('/videos', protect, getVideos);
router.get('/videos/:id', protect, getVideoById);

module.exports = router;
