const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Admin: Create Assignment
exports.createAssignment = async (req, res) => {
  try {
    const { title, instructions, courseId, lessonId, minWords, maxWords, dueDate, isActive } = req.body;

    const assignment = new Assignment({
      title,
      instructions,
      courseId,
      lessonId,
      minWords: minWords || 1000,
      maxWords: maxWords || 1500,
      dueDate,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    await assignment.save();

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ success: false, message: 'Server error creating assignment' });
  }
};

// Admin/Student: Get assignments
exports.getAssignments = async (req, res) => {
  try {
    const { courseId, lessonId } = req.query;
    const filter = {};
    if (courseId) filter.courseId = courseId;
    if (lessonId) filter.lessonId = lessonId;

    const assignments = await Assignment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ success: false, message: 'Server error fetching assignments' });
  }
};

// Admin: Update Assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, instructions, courseId, lessonId, minWords, maxWords, dueDate, isActive } = req.body;

    const assignment = await Assignment.findByIdAndUpdate(
      id,
      {
        title,
        instructions,
        courseId,
        lessonId,
        minWords: minWords || 1000,
        maxWords: maxWords || 1500,
        dueDate,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.json({ success: true, assignment });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ success: false, message: 'Server error updating assignment' });
  }
};

// Admin: Delete Assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    // Also delete submissions associated
    await AssignmentSubmission.deleteMany({ assignmentId: id });

    res.json({ success: true, message: 'Assignment and related submissions deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ success: false, message: 'Server error deleting assignment' });
  }
};

// Student: Get my submission or draft for an assignment
exports.getMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;

    const submission = await AssignmentSubmission.findOne({ assignmentId, userId });
    res.json({ success: true, submission });
  } catch (error) {
    console.error('Error fetching student submission:', error);
    res.status(500).json({ success: false, message: 'Server error fetching submission' });
  }
};

// Student: Submit or Save Draft
exports.submitOrSaveDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const { assignmentId, courseId, lessonId, essayContent, wordCount, status } = req.body;

    // Check if assignment is active
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (!assignment.isActive) {
      return res.status(400).json({ success: false, message: 'Assignment is currently disabled' });
    }

    // Check deadline
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ success: false, message: 'Assignment deadline has passed' });
    }

    // Find existing submission/draft
    let submission = await AssignmentSubmission.findOne({ assignmentId, userId });

    // If it's a full submission, perform validation
    if (status === 'Submitted') {
      if (!essayContent || essayContent.trim() === '') {
        return res.status(400).json({ success: false, message: 'Please complete your essay before submitting' });
      }
      if (wordCount < assignment.minWords) {
        return res.status(400).json({ success: false, message: `Minimum ${assignment.minWords} words required.` });
      }
      if (wordCount > assignment.maxWords) {
        return res.status(400).json({ success: false, message: `Maximum ${assignment.maxWords} words exceeded.` });
      }
    }

    if (submission) {
      // If locked (already submitted & not needs revision), prevent edits unless Admin allowed it
      if (submission.status === 'Submitted' || submission.status === 'Approved' || submission.status === 'Reviewed') {
        return res.status(400).json({ success: false, message: 'Assignment already submitted and locked' });
      }

      submission.essayContent = essayContent;
      submission.wordCount = wordCount;
      submission.status = status; // 'Draft' or 'Submitted'
      if (status === 'Submitted') {
        submission.submittedAt = Date.now();
      }
      submission.updatedAt = Date.now();
      await submission.save();
    } else {
      submission = new AssignmentSubmission({
        assignmentId,
        userId,
        courseId,
        lessonId,
        essayContent,
        wordCount,
        status,
        submittedAt: status === 'Submitted' ? Date.now() : null
      });
      await submission.save();
    }

    // Notify admins when a user submits
    if (status === 'Submitted') {
      try {
        const admins = await User.find({ role: { $in: ['admin', 'super-admin', 'admin_course'] } });
        for (const admin of admins) {
          await new Notification({
            user: admin._id,
            title: '✍️ New Essay Submission',
            message: `A student has submitted an essay for assignment "${assignment.title}".`,
            type: 'info',
            link: '/admin/assignments' // Points to admin assignments dashboard
          }).save();
        }
      } catch (notifErr) {
        console.error('Error creating admin notification:', notifErr);
      }
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error('Error submitting/saving draft:', error);
    res.status(500).json({ success: false, message: 'Server error submitting assignment' });
  }
};

// Admin: View all submissions
exports.getSubmissions = async (req, res) => {
  try {
    const { courseId, lessonId, userId } = req.query;
    const filter = {};
    if (courseId) filter.courseId = courseId;
    if (lessonId) filter.lessonId = lessonId;
    if (userId) filter.userId = userId;

    const submissions = await AssignmentSubmission.find(filter)
      .populate('assignmentId')
      .populate('userId', 'name email progress')
      .sort({ updatedAt: -1 });

    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, message: 'Server error fetching submissions' });
  }
};

// Admin: Review submission
exports.reviewSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminFeedback, score } = req.body;

    const submission = await AssignmentSubmission.findById(id).populate('assignmentId');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    submission.status = status; // e.g. Approved, Needs Revision, Reviewed
    submission.adminFeedback = adminFeedback || '';
    submission.score = score;
    submission.reviewedAt = Date.now();
    submission.updatedAt = Date.now();
    await submission.save();

    // Create user notification
    try {
      const statusIcon = status === 'Approved' ? '✅' : '⚠️';
      const statusMessage = status === 'Approved' 
        ? `Great job! Your essay for "${submission.assignmentId.title}" has been approved with a score of ${score || 0}.`
        : `Your essay for "${submission.assignmentId.title}" needs revision. Feedback: "${adminFeedback}"`;

      await new Notification({
        user: submission.userId,
        title: `${statusIcon} Assignment Reviewed`,
        message: statusMessage,
        type: status === 'Approved' ? 'success' : 'warning',
        link: '/dashboard/courses'
      }).save();
    } catch (notifErr) {
      console.error('Error notifying student about review:', notifErr);
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ success: false, message: 'Server error reviewing submission' });
  }
};
