const express = require('express');
const { getAllQuizzes, submitQuiz, createQuiz, getQuizzesByEmployer, generateFromYoutube, publishQuiz, getAllResults } = require('../controllers/quizController');
const router = express.Router();

router.get('/', getAllQuizzes);
router.get('/results', getAllResults);
router.get('/employer/:employerId', getQuizzesByEmployer);
router.post('/', createQuiz);
router.post('/submit', submitQuiz);
router.post('/generate-from-youtube', generateFromYoutube);
router.post('/:quizId/publish', publishQuiz);

module.exports = router;
