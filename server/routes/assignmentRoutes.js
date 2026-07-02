const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  getMySubmission,
  submitOrSaveDraft,
  getSubmissions,
  reviewSubmission
} = require('../controllers/assignmentController');

// All assignment routes require authentication
router.use(protect);

// ── SPECIFIC NAMED ROUTES (must come before wildcard /:id) ──────────────
// Student: list active assignments (optionally filtered by courseId)
router.get('/', getAssignments);

// Admin: get all submissions
router.get('/submissions', adminOnly, getSubmissions);

// Admin: review a specific submission
router.put('/submissions/:id/review', adminOnly, reviewSubmission);

// Student: get own submission for an assignment
router.get('/my-submission/:assignmentId', getMySubmission);

// Student: save draft or submit
router.post('/submit', submitOrSaveDraft);

// Admin: create assignment
router.post('/', adminOnly, createAssignment);

// ── WILDCARD ROUTES (must come LAST) ────────────────────────────────────
// Admin: update assignment
router.put('/:id', adminOnly, updateAssignment);

// Admin: delete assignment
router.delete('/:id', adminOnly, deleteAssignment);

module.exports = router;
