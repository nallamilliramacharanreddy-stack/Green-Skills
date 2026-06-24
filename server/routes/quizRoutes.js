const express = require('express');
const { 
  getAllQuizzes, 
  submitQuiz, 
  createQuiz, 
  getQuizzesByEmployer, 
  generateFromYoutube, 
  publishQuiz, 
  getAllResults,
  getLatestCourseResult,
  getCourseResults,
  startQuizAttempt,
  saveQuizProgress,
  getIntegrityReport,
  invalidateResultScore
} = require('../controllers/quizController');
const router = express.Router();

router.get('/', getAllQuizzes);
router.get('/results/latest', getLatestCourseResult);
router.get('/results/course', getCourseResults);
router.get('/results', getAllResults);
router.get('/integrity-report', getIntegrityReport);
router.get('/employer/:employerId', getQuizzesByEmployer);
router.post('/', createQuiz);
router.post('/submit', submitQuiz);
router.post('/start-attempt', startQuizAttempt);
router.post('/save-progress', saveQuizProgress);
router.post('/generate-from-youtube', generateFromYoutube);
router.post('/:quizId/publish', publishQuiz);
router.put('/results/:id/invalidate', invalidateResultScore);

module.exports = router;
