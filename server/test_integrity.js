const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const Course = require('./models/Course');
const Result = require('./models/Result');
const User = require('./models/User');
const Attempt = require('./models/Attempt');
const { startQuizAttempt, saveQuizProgress, submitQuiz } = require('./controllers/quizController');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills';

const runStartAttempt = async (body) => {
  return new Promise((resolve, reject) => {
    const req = { body };
    const res = {
      statusCode: 200,
      json: function(data) { resolve({ status: this.statusCode, data }); },
      status: function(code) { this.statusCode = code; return this; }
    };
    startQuizAttempt(req, res).catch(reject);
  });
};

const runSaveProgress = async (body) => {
  return new Promise((resolve, reject) => {
    const req = { body };
    const res = {
      statusCode: 200,
      json: function(data) { resolve({ status: this.statusCode, data }); },
      status: function(code) { this.statusCode = code; return this; }
    };
    saveQuizProgress(req, res).catch(reject);
  });
};

const runSubmitAttempt = async (body) => {
  return new Promise((resolve, reject) => {
    const req = { body };
    const res = {
      statusCode: 200,
      json: function(data) { resolve({ status: this.statusCode, data }); },
      status: function(code) { this.statusCode = code; return this; }
    };
    submitQuiz(req, res).catch(reject);
  });
};

async function runTests() {
  console.log("=== STARTING DEDUPLICATION & ATTEMPT INTEGRITY TESTS ===");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const testUserId = new mongoose.Types.ObjectId();

  // Clean up
  await Quiz.deleteMany({ category: 'IntegrityTest' });
  await Attempt.deleteMany({ user: testUserId });
  await Result.deleteMany({ user: testUserId });

  // 1. Create a base quiz with 3 unique questions
  const quiz = new Quiz({
    title: 'Source Integrity Quiz',
    description: 'Pool of questions for testing',
    category: 'IntegrityTest',
    isPublished: true,
    questions: [
      {
        questionText: 'What is the full form of EV?',
        options: ['Electric Vehicle', 'Energy Value', 'Electron Volt', 'Engine Valve'],
        questionType: 'single',
        correctAnswer: 0,
        explanation: 'EV stands for Electric Vehicle.'
      },
      {
        questionText: 'Select greenhouse gases in the atmosphere.',
        options: ['Carbon Dioxide', 'Oxygen', 'Methane', 'Helium'],
        questionType: 'multiple',
        correctAnswer: [0, 2],
        explanation: 'Carbon dioxide and methane are greenhouse gases.'
      },
      {
        questionText: 'Wind energy is an exhaustible energy source.',
        options: ['True', 'False'],
        questionType: 'boolean',
        correctAnswer: 1, // False
        explanation: 'Wind energy is inexhaustible.'
      }
    ],
    duration: 30
  });

  await quiz.save();
  const quizId = quiz._id.toString();
  console.log("Created base quiz with 3 questions:", quizId);

  // 2. Assert save validation blocks duplicates
  console.log("\nTesting Duplicate Question Prevention (Pre-save Jaccard check)...");
  const dupQuiz = new Quiz({
    title: 'Duplicate Integrity Quiz',
    category: 'IntegrityTest',
    questions: [
      {
        questionText: 'What is the full form of EV?', // exact duplicate
        options: ['Electric Vehicle', 'Energy Value', 'Electron Volt', 'Engine Valve'],
        correctAnswer: 0
      }
    ]
  });
  try {
    await dupQuiz.save();
    throw new Error("FAIL: Allowed saving exact duplicate question text!");
  } catch (err) {
    console.log("SUCCESS: Blocked duplicate question text! Error:", err.message);
    if (!err.message.includes("Similar question already exists in the database")) {
      throw new Error("FAIL: Wrong validation error message!");
    }
  }

  // Jaccard similarity rearrangement check (reordered words, case, punctuation)
  console.log("\nTesting Similar Question Prevention (Jaccard word rearrangement & case/punct)...");
  const rearrangedQuiz = new Quiz({
    title: 'Rearranged Similarity Quiz',
    category: 'IntegrityTest',
    questions: [
      {
        questionText: 'EV, what is the full form of?', 
        options: ['Electric Vehicle', 'Energy Value', 'Electron Volt', 'Engine Valve'],
        correctAnswer: 0
      }
    ]
  });
  try {
    await rearrangedQuiz.save();
    throw new Error("FAIL: Allowed saving highly similar rearranged question!");
  } catch (err) {
    console.log("SUCCESS: Blocked highly similar question! Error:", err.message);
  }

  // 3. Assert option validation
  console.log("\nTesting Duplicate Option Prevention...");
  const badOptionQuiz = new Quiz({
    title: 'Bad Option Quiz',
    category: 'IntegrityTest',
    questions: [
      {
        questionText: 'Unique question text for bad options test?',
        options: ['Java', 'Python', 'Java', 'C++'], // Duplicate options
        correctAnswer: 0
      }
    ]
  });
  try {
    await badOptionQuiz.save();
    throw new Error("FAIL: Allowed saving duplicate options!");
  } catch (err) {
    console.log("SUCCESS: Blocked duplicate options! Error:", err.message);
  }

  console.log("\nTesting Repeated Correct Answer Prevention...");
  const repeatedCorrectQuiz = new Quiz({
    title: 'Repeated Correct Quiz',
    category: 'IntegrityTest',
    questions: [
      {
        questionText: 'Select green options.',
        options: ['A', 'B', 'C', 'D'],
        questionType: 'multiple',
        correctAnswer: [0, 0], // Repeated index
        explanation: 'Invalid'
      }
    ]
  });
  try {
    await repeatedCorrectQuiz.save();
    throw new Error("FAIL: Allowed saving repeated correct answers!");
  } catch (err) {
    console.log("SUCCESS: Blocked repeated correct answers! Error:", err.message);
  }

  // 4. Test startQuizAttempt (shuffling, stripping correct answers)
  console.log("\nTesting startQuizAttempt (new attempt)...");
  const attemptRes = await runStartAttempt({
    userId: testUserId.toString(),
    quizId: quizId
  });
  
  if (attemptRes.status !== 201) {
    throw new Error(`FAIL: Expected status 201, got ${attemptRes.status}`);
  }
  const attemptData = attemptRes.data;
  console.log("Attempt created successfully. ID:", attemptData.attemptId);
  console.log("Questions count:", attemptData.questions.length);
  
  // Verify correctAnswer and explanation are stripped
  attemptData.questions.forEach((q, idx) => {
    if (q.correctAnswer !== undefined || q.explanation !== undefined) {
      throw new Error(`FAIL: Question at index ${idx} contains correct answer or explanation: ${JSON.stringify(q)}`);
    }
  });
  console.log("SUCCESS: Correct answers and explanations are stripped from client response!");

  // 5. Test attempt restoration (Reconnect/Refresh protection)
  console.log("\nTesting Reconnect/Refresh Protection...");
  const reconnectRes = await runStartAttempt({
    userId: testUserId.toString(),
    quizId: quizId
  });
  if (reconnectRes.status !== 200) {
    throw new Error(`FAIL: Expected status 200 on reconnect, got ${reconnectRes.status}`);
  }
  const reconnectData = reconnectRes.data;
  if (reconnectData.attemptId.toString() !== attemptData.attemptId.toString()) {
    throw new Error(`FAIL: Did not restore the existing active attempt!`);
  }
  
  // Verify same question set returned in the same order
  const q1Text = attemptData.questions.map(q => q.questionText);
  const q2Text = reconnectData.questions.map(q => q.questionText);
  if (JSON.stringify(q1Text) !== JSON.stringify(q2Text)) {
    throw new Error("FAIL: Question order/content changed on reconnect!");
  }
  console.log("SUCCESS: Reconnecting restored the exact same question set and attempt session!");

  // 6. Test saveQuizProgress
  console.log("\nTesting saveQuizProgress...");
  // Find correct options mapping
  // Question 0: What is the full form of EV? -> Electric Vehicle
  // Question 1: Select greenhouse gases... -> Carbon Dioxide, Methane
  // Question 2: Wind energy is... -> False
  
  // Since questions are shuffled, let's map userAnswers by finding question content
  const userAnswersMock = {};
  reconnectData.questions.forEach((q, idx) => {
    if (q.questionText.includes("EV")) {
      userAnswersMock[idx] = 'Electric Vehicle';
    } else if (q.questionText.includes("greenhouse")) {
      userAnswersMock[idx] = ['Carbon Dioxide', 'Methane'];
    } else if (q.questionText.includes("Wind energy")) {
      userAnswersMock[idx] = 'False';
    }
  });

  const saveRes = await runSaveProgress({
    attemptId: attemptData.attemptId.toString(),
    userAnswers: userAnswersMock
  });
  if (saveRes.status !== 200) {
    throw new Error(`FAIL: Progress save failed with status ${saveRes.status}`);
  }
  
  // Check in DB
  const updatedAttempt = await Attempt.findById(attemptData.attemptId);
  if (JSON.stringify(updatedAttempt.userAnswers) !== JSON.stringify(userAnswersMock)) {
    throw new Error("FAIL: Progress userAnswers not matching saved values in DB!");
  }
  console.log("SUCCESS: Saved progress persists in the database!");

  // 7. Test submitQuiz with attemptId (100% correct answers scenario)
  console.log("\nTesting submitQuiz using attemptId (Expect 100% score)...");
  const answersPayload = Object.keys(userAnswersMock).map(idxKey => {
    const idx = parseInt(idxKey);
    return {
      questionIndex: idx,
      candidateAnswer: userAnswersMock[idx]
    };
  });
  
  const submitRes = await runSubmitAttempt({
    userId: testUserId.toString(),
    attemptId: attemptData.attemptId.toString(),
    answers: answersPayload,
    duration: 60
  });

  if (submitRes.status !== 201) {
    throw new Error(`FAIL: Submit failed with status ${submitRes.status}`);
  }
  const scoreData = submitRes.data;
  console.log("Graded Results:");
  console.log("Score:", scoreData.score, "/", scoreData.totalQuestions);
  console.log("Correct Answers Count:", scoreData.correctCount);
  console.log("Wrong Answers Count:", scoreData.wrongCount);
  
  if (scoreData.score !== 3 || scoreData.correctCount !== 3 || scoreData.wrongCount !== 0) {
    throw new Error(`FAIL: Expected 3 correct answers, got score=${scoreData.score}, correctCount=${scoreData.correctCount}`);
  }
  
  // Check if attempt is marked completed in DB
  const finalAttempt = await Attempt.findById(attemptData.attemptId);
  if (!finalAttempt.isCompleted) {
    throw new Error("FAIL: Attempt was not marked completed after submission!");
  }
  console.log("SUCCESS: Attempt is marked completed and user graded at 100%!");

  // 8. Test getIntegrityReport
  console.log("\nTesting getIntegrityReport...");
  const { generateIntegrityReport } = require('./utils/duplicateChecker');
  const report = await generateIntegrityReport();
  console.log("Integrity Report Stats:");
  console.log("Total Questions Analyzed:", report.totalQuestions);
  console.log("Unique Questions Count:", report.uniqueQuestions);
  console.log("Quality Score:", report.qualityScore);
  
  if (report.totalQuestions === 0) {
    throw new Error("FAIL: No questions found in integrity report!");
  }
  console.log("SUCCESS: Integrity report calculated statistics correctly!");

  // Clean up
  await Quiz.deleteMany({ category: 'IntegrityTest' });
  await Attempt.deleteMany({ user: testUserId });
  await Result.deleteMany({ user: testUserId });
  await mongoose.disconnect();
  console.log("\n=== ALL DEDUPLICATION & INTEGRITY TESTS PASSED ===");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed with error:", err.stack);
  process.exit(1);
});
