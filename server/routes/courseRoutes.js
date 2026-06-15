const express = require('express');
const { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse, generateQuizFromYoutube, generateAIAssessment, enrollInCourse, unenrollInCourse, completeCourse, completeLesson, completeTask } = require('../controllers/courseController');
const router = express.Router();

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);
router.post('/:id/generate-quiz', generateQuizFromYoutube);
router.post('/generate-ai-assessment', generateAIAssessment);
router.post('/:id/enroll', enrollInCourse);
router.post('/:id/unenroll', unenrollInCourse);
router.post('/:id/complete', completeCourse);
router.post('/:id/complete-lesson', completeLesson);
router.post('/:id/complete-task', completeTask);

module.exports = router;
