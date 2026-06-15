const mongoose = require('mongoose');
const Course = require('./models/Course');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills').then(async () => {
  try {
    const course = await Course.findOne();
    const user = await User.findOne({ role: 'student' });
    if (!course || !user) {
      console.log('Missing course or user');
      process.exit(0);
    }
    console.log('Testing enroll for User:', user.email, 'Course:', course.title);
    
    // Simulate the exact code in enrollInCourse
    if (!course.enrolledStudents) {
      course.enrolledStudents = [];
    }
    if (!course.enrolledStudents.some(sId => sId && sId.toString() === user._id.toString())) {
      course.enrolledStudents.push(user._id);
      await course.save();
    }

    if (!user.progress) {
      user.progress = { completedCourses: [], currentCourses: [], courseProgress: [] };
    } else {
      if (!user.progress.completedCourses) user.progress.completedCourses = [];
      if (!user.progress.currentCourses) user.progress.currentCourses = [];
      if (!user.progress.courseProgress) user.progress.courseProgress = [];
    }

    if (!user.progress.currentCourses.some(cId => cId && cId.toString() === course._id.toString()) && 
        !user.progress.completedCourses.some(cId => cId && cId.toString() === course._id.toString())) {
      user.progress.currentCourses.push(course._id);
      
      if (!user.progress.courseProgress.find(p => p && p.courseId && p.courseId.toString() === course._id.toString())) {
        user.progress.courseProgress.push({
          courseId: course._id,
          completedLessons: [],
          completedTasks: []
        });
      }

      user.markModified('progress'); 
      await user.save();
    }
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
});
