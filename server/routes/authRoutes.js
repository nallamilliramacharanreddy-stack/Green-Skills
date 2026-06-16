const express = require('express');
const { 
  signup, login, getAllUsers, getAllHirers, getAllAdmins, 
  approveAdmin, approveHirer, rejectHirer, updateUserStatus, deleteUser, getLeaderboard,
  requestReactivation, handleSuspensionRequest, updateProfile, forgotPasswordRequest, verifyForgotPasswordOtp, resetPasswordWithOtp, verifyAdminOtp,
  addNote, deleteNote, editNote, verifyFaceLogin
} = require('../controllers/authController');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 } // 1MB limit
});

router.post('/signup', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'companyDocument', maxCount: 1 }
]), signup);
router.post('/login', login);
router.post('/verify-face-login', verifyFaceLogin);
router.post('/verify-admin-otp', verifyAdminOtp);
router.post('/forgot-password-request', forgotPasswordRequest);
router.post('/verify-reset-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPasswordWithOtp);

// Admin Routes
router.get('/users', getAllUsers);
router.get('/hirers', getAllHirers);
router.get('/admins', getAllAdmins);
router.patch('/admins/:id/approve', approveAdmin);
router.patch('/hirers/:id/approve', approveHirer);
router.delete('/hirers/:id/reject', rejectHirer);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);
router.post('/request-reactivation', requestReactivation);
router.post('/handle-suspension/:id', handleSuspensionRequest);
router.get('/leaderboard', getLeaderboard);

// Profile Routes
router.put('/profile/:id', upload.single('profilePicture'), updateProfile);

// Notes Routes
router.post('/users/:id/notes', addNote);
router.delete('/users/:id/notes/:noteId', deleteNote);

module.exports = router;
