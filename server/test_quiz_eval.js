const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const Course = require('./models/Course');
const Result = require('./models/Result');
const User = require('./models/User');
const { submitQuiz } = require('./controllers/quizController');

// Helper to mock request/response
const runSubmit = async (body) => {
  return new Promise((resolve, reject) => {
    const req = { body };
    const res = {
      statusCode: 200,
      json: function(data) {
        resolve({ status: this.statusCode, data });
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      }
    };
    submitQuiz(req, res).catch(reject);
  });
};

async function runTests() {
  console.log("=== STARTING AUTOMATED QUIZ EVALUATION TESTS ===");
  
  // 1. Connect to local Test DB
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills';
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clean up old test docs
  const testUserId = new mongoose.Types.ObjectId();
  const testCourseId = new mongoose.Types.ObjectId();
  
  // Clean up any existing tests
  await Quiz.deleteMany({ category: 'UnitTest' });
  await Result.deleteMany({ user: testUserId });

  // 2. Create mock quiz with diverse question types
  const testQuiz = new Quiz({
    title: 'Unit Test Quiz',
    description: 'Testing multiple question types and server grading',
    category: 'UnitTest',
    isPublished: true,
    questions: [
      {
        questionText: 'Which EV batteries are most common?',
        options: ['Lead-acid', 'Lithium-ion', 'Nickel-cadmium', 'Sodium-ion'],
        questionType: 'single',
        correctAnswer: 1, // Lithium-ion
        explanation: 'Lithium-ion batteries offer high energy density.'
      },
      {
        questionText: 'Select all renewable energy sources.',
        options: ['Solar', 'Coal', 'Wind', 'Natural Gas'],
        questionType: 'multiple',
        correctAnswer: [0, 2], // Solar, Wind
        explanation: 'Solar and wind are renewable energy sources.'
      },
      {
        questionText: 'Global warming is primarily caused by greenhouse gases.',
        options: ['True', 'False'],
        questionType: 'boolean',
        correctAnswer: 0, // True
        explanation: 'Greenhouse gases trap heat in the atmosphere.'
      },
      {
        questionText: 'What is the full form of PV in solar PV panels?',
        options: [],
        questionType: 'text',
        correctAnswer: 'photovoltaic',
        explanation: 'PV stands for photovoltaic.'
      },
      {
        questionText: 'Select greenhouse gases.',
        options: ['Carbon Dioxide', 'Oxygen', 'Methane', 'Nitrogen'],
        questionType: 'multiple',
        correctAnswer: [0, 2], // CO2, Methane
        explanation: 'CO2 and Methane are greenhouse gases.'
      }
    ],
    duration: 15,
    createdBy: new mongoose.Types.ObjectId()
  });

  await testQuiz.save();
  const quizId = testQuiz._id.toString();
  console.log("Saved Unit Test Quiz to DB:", quizId);

  // Scenario 1: All answers correct
  console.log("\n--- Scenario 1: All answers correct ---");
  const body1 = {
    userId: testUserId.toString(),
    quizId: quizId,
    duration: 120,
    answers: [
      { questionIndex: 0, candidateAnswer: 'Lithium-ion' }, // correct option string
      { questionIndex: 1, candidateAnswer: ['Solar', 'Wind'] }, // correct option strings array
      { questionIndex: 2, candidateAnswer: '0' }, // correct option index string
      { questionIndex: 3, candidateAnswer: 'Photovoltaic' }, // correct case-insensitive text
      { questionIndex: 4, candidateAnswer: [0, 2] } // correct indices array
    ]
  };
  let res1 = await runSubmit(body1);
  console.log("Response Status:", res1.status);
  console.log("Score:", res1.data.score, "/", res1.data.totalQuestions);
  console.log("Correct Count:", res1.data.correctCount, "Wrong:", res1.data.wrongCount, "Not Attempted:", res1.data.notAttemptedCount);
  console.log("Status:", res1.data.status);
  
  if (res1.status !== 201 || res1.data.score !== 5 || res1.data.correctCount !== 5 || res1.data.wrongCount !== 0 || res1.data.status !== 'Pass') {
    throw new Error("Scenario 1 failed! Inaccurate grading.");
  }
  console.log("Scenario 1 Passed!");

  // Scenario 2: All answers wrong
  console.log("\n--- Scenario 2: All answers wrong ---");
  const body2 = {
    userId: testUserId.toString(),
    quizId: quizId,
    duration: 120,
    answers: [
      { questionIndex: 0, candidateAnswer: 'Lead-acid' }, // wrong
      { questionIndex: 1, candidateAnswer: ['Coal', 'Natural Gas'] }, // wrong
      { questionIndex: 2, candidateAnswer: 'False' }, // wrong
      { questionIndex: 3, candidateAnswer: 'thermal energy' }, // wrong
      { questionIndex: 4, candidateAnswer: [1, 3] } // wrong
    ]
  };
  let res2 = await runSubmit(body2);
  console.log("Response Status:", res2.status);
  console.log("Score:", res2.data.score);
  console.log("Correct Count:", res2.data.correctCount, "Wrong:", res2.data.wrongCount);
  console.log("Status:", res2.data.status);

  if (res2.status !== 201 || res2.data.score !== 0 || res2.data.correctCount !== 0 || res2.data.wrongCount !== 5 || res2.data.status !== 'Fail') {
    throw new Error("Scenario 2 failed! Inaccurate grading.");
  }
  console.log("Scenario 2 Passed!");

  // Scenario 3: Partially correct
  console.log("\n--- Scenario 3: Partially correct ---");
  const body3 = {
    userId: testUserId.toString(),
    quizId: quizId,
    duration: 120,
    answers: [
      { questionIndex: 0, candidateAnswer: 'Lithium-ion' }, // correct
      { questionIndex: 1, candidateAnswer: ['Solar', 'Wind'] }, // correct
      { questionIndex: 2, candidateAnswer: 'False' }, // wrong
      { questionIndex: 3, candidateAnswer: 'solar panel' }, // wrong
      { questionIndex: 4, candidateAnswer: [0] } // wrong (partial MC selection is marked wrong)
    ]
  };
  let res3 = await runSubmit(body3);
  console.log("Response Status:", res3.status);
  console.log("Score:", res3.data.score);
  console.log("Correct Count:", res3.data.correctCount, "Wrong:", res3.data.wrongCount);
  
  if (res3.status !== 201 || res3.data.score !== 2 || res3.data.correctCount !== 2 || res3.data.wrongCount !== 3) {
    throw new Error("Scenario 3 failed! Inaccurate grading.");
  }
  console.log("Scenario 3 Passed!");

  // Scenario 4: Unanswered questions
  console.log("\n--- Scenario 4: Partially unanswered ---");
  const body4 = {
    userId: testUserId.toString(),
    quizId: quizId,
    duration: 120,
    answers: [
      { questionIndex: 0, candidateAnswer: 'Lithium-ion' }, // correct
      { questionIndex: 1, candidateAnswer: '' }, // unanswered
      { questionIndex: 2, candidateAnswer: 'True' }, // correct
      // index 3 is omitted entirely
      { questionIndex: 4, candidateAnswer: [0, 2] } // correct
    ]
  };
  let res4 = await runSubmit(body4);
  console.log("Response Status:", res4.status);
  console.log("Score:", res4.data.score);
  console.log("Correct Count:", res4.data.correctCount, "Wrong:", res4.data.wrongCount, "Not Attempted:", res4.data.notAttemptedCount);
  
  if (res4.status !== 201 || res4.data.score !== 3 || res4.data.correctCount !== 3 || res4.data.wrongCount !== 0 || res4.data.notAttemptedCount !== 2) {
    throw new Error("Scenario 4 failed! Inaccurate grading.");
  }
  console.log("Scenario 4 Passed!");

  // Scenario 5: Multiple-choice matching (order independent)
  console.log("\n--- Scenario 5: Multiple-choice order independence ---");
  const body5 = {
    userId: testUserId.toString(),
    quizId: quizId,
    duration: 120,
    answers: [
      { questionIndex: 0, candidateAnswer: 'Lithium-ion' }, // correct
      { questionIndex: 1, candidateAnswer: ['Wind', 'Solar'] }, // correct (opposite order)
      { questionIndex: 2, candidateAnswer: '0' }, // correct
      { questionIndex: 3, candidateAnswer: 'photovoltaic ' }, // correct (trailing space)
      { questionIndex: 4, candidateAnswer: [2, 0] } // correct (opposite order indices)
    ]
  };
  let res5 = await runSubmit(body5);
  console.log("Response Status:", res5.status);
  console.log("Score:", res5.data.score);
  
  if (res5.status !== 201 || res5.data.score !== 5 || res5.data.correctCount !== 5) {
    throw new Error("Scenario 5 failed! Inaccurate order-independence grading.");
  }
  console.log("Scenario 5 Passed!");

  // Scenario 6: Database validation error (missing predefined correct answers)
  console.log("\n--- Scenario 6: Database validation check ---");
  // Modify one of the questions in database to strip correctAnswer
  await Quiz.updateOne(
    { _id: testQuiz._id, "questions.questionText": "Which EV batteries are most common?" },
    { $unset: { "questions.$.correctAnswer": "" } }
  );

  const body6 = {
    userId: testUserId.toString(),
    quizId: quizId,
    duration: 120,
    answers: [
      { questionIndex: 0, candidateAnswer: 'Lithium-ion' }
    ]
  };
  let res6 = await runSubmit(body6);
  console.log("Response Status:", res6.status);
  console.log("Response Message:", res6.data.message);

  if (res6.status !== 400 || !res6.data.message.includes("Predefined correct answer missing in the database")) {
    throw new Error("Scenario 6 failed! Evaluation was not blocked when correct answer was missing.");
  }
  console.log("Scenario 6 Passed!");

  // Clean up
  await Quiz.deleteMany({ category: 'UnitTest' });
  await Result.deleteMany({ user: testUserId });
  await mongoose.disconnect();
  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed with error:", err.message);
  process.exit(1);
});
