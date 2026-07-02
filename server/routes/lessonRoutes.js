const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const User = require('../models/User');

// GET /api/lessons/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findOne({ 'lessons._id': req.params.id });
    if (!course) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    const lesson = course.lessons.id(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const user = await User.findById(req.user.id);
    let completed = false;
    if (user && user.progress && user.progress.courseProgress) {
      const prog = user.progress.courseProgress.find(p => p.courseId.toString() === course._id.toString());
      if (prog && prog.completedLessons) {
        const lessonIndex = course.lessons.findIndex(l => l._id.toString() === req.params.id);
        completed = prog.completedLessons.includes(lessonIndex);
      }
    }

    // Determine the video url and public id, preferring Cloudinary URLs and filtering out local paths
    let videoUrl = lesson.directVideoUrl || lesson.internalVideoUrl || lesson.youtubeLink || '';
    if (videoUrl.includes('/uploads/') || videoUrl.includes('/api/videos/stream/')) {
      videoUrl = ''; // Avoid returning local paths
    }

    let publicId = lesson.directVideoPublicId || lesson.internalVideoPublicId || '';
    if (publicId.startsWith('local-')) {
      publicId = '';
    }

    res.json({
      lessonId: lesson._id,
      title: lesson.title,
      videoUrl: videoUrl,
      publicId: publicId,
      duration: lesson.duration || '10:00',
      completed: completed
    });
  } catch (error) {
    console.error('Error fetching lesson details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
