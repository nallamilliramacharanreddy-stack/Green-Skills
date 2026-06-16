const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const Course = require('./models/Course');
const Result = require('./models/Result');
const User = require('./models/User');
const { publishQuiz } = require('./controllers/quizController');

const mockRes = () => {
  const res = {
    statusCode: 200,
    json: function(data) {
      this.data = data;
      return this;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    }
  };
  return res;
};

async function testPublish() {
  console.log("=== STARTING PUBLISH AND NORMALIZATION INTEGRATION TESTS ===");
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills';
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clean up
  await Course.deleteMany({ title: 'Integration Test Course' });
  await Quiz.deleteMany({ category: 'IntegrationTest' });

  // 1. Create a course
  const course = new Course({
    title: 'Integration Test Course',
    description: 'Testing publishing validation and correctAnswer parsing',
    category: 'Green Skill',
    difficulty: 'Beginner',
    duration: '2 hours',
    lessons: [
      {
        moduleTitle: 'Module 1',
        title: 'Lesson 1',
        videoSource: 'youtube',
        youtubeLink: 'https://youtube.com/watch?v=123',
        duration: '10:00',
        quiz: []
      }
    ],
    quiz: []
  });
  await course.save();
  console.log("Saved Test Course:", course._id);

  // 2. Create mock quizzes in database with different correctAnswer formats
  // Quiz A: correctAnswer is already a string option (e.g. "Lithium-ion")
  const quizA = new Quiz({
    title: 'Quiz A (String Option)',
    category: 'IntegrationTest',
    courseId: course._id,
    lessonId: course.lessons[0]._id,
    questions: [
      {
        questionText: 'What is green energy?',
        options: ['Coal energy', 'Solar energy', 'Gas energy', 'Oil energy'],
        correctAnswer: 'Solar energy',
        explanation: 'Solar is green.'
      }
    ]
  });
  await quizA.save();
  console.log("Saved Quiz A (String Option):", quizA._id);

  // Quiz B: correctAnswer is a numeric index (e.g. 1)
  const quizB = new Quiz({
    title: 'Quiz B (Index Number)',
    category: 'IntegrationTest',
    courseId: course._id,
    // course-level quiz (no lessonId)
    questions: [
      {
        questionText: 'Which EV batteries are most common?',
        options: ['Lead-acid', 'Lithium-ion', 'Nickel-cadmium', 'Sodium-ion'],
        correctAnswer: 1, // index
        explanation: 'Lithium-ion is correct.'
      }
    ]
  });
  await quizB.save();
  console.log("Saved Quiz B (Index Number):", quizB._id);

  // Quiz C: correctAnswer is a numeric string index (e.g. "1")
  const quizC = new Quiz({
    title: 'Quiz C (Index String)',
    category: 'IntegrationTest',
    courseId: course._id,
    questions: [
      {
        questionText: 'Is wind energy renewable?',
        options: ['No', 'Yes', 'Maybe', 'Never'],
        correctAnswer: '1', // stringified index
        explanation: 'Yes is correct.'
      }
    ]
  });
  await quizC.save();
  console.log("Saved Quiz C (Index String):", quizC._id);

  // 3. Publish Quiz A (checks lesson level appending with string option)
  console.log("\n--- Publishing Quiz A ---");
  const resA = mockRes();
  await publishQuiz({ params: { quizId: quizA._id.toString() } }, resA);
  console.log("Publish Status A:", resA.statusCode);
  if (resA.statusCode !== 200) {
    throw new Error(`Failed to publish Quiz A: ${JSON.stringify(resA.data)}`);
  }
  console.log("Quiz A published successfully.");

  // 4. Publish Quiz B (checks course level appending with numeric index)
  console.log("\n--- Publishing Quiz B ---");
  const resB = mockRes();
  await publishQuiz({ params: { quizId: quizB._id.toString() } }, resB);
  console.log("Publish Status B:", resB.statusCode);
  if (resB.statusCode !== 200) {
    throw new Error(`Failed to publish Quiz B: ${JSON.stringify(resB.data)}`);
  }
  console.log("Quiz B published successfully.");

  // Verify course changes in DB
  const updatedCourse = await Course.findById(course._id);
  
  console.log("\n--- Verification of Course Quiz Arrays in Database ---");
  console.log("Lesson 1 Quiz:", JSON.stringify(updatedCourse.lessons[0].quiz, null, 2));
  console.log("Course Level Quiz:", JSON.stringify(updatedCourse.quiz, null, 2));

  // Assertions for Quiz A (Lesson level)
  if (updatedCourse.lessons[0].quiz.length !== 1) {
    throw new Error("Quiz A was not added to Lesson 1!");
  }
  if (updatedCourse.lessons[0].quiz[0].correctAnswer !== 'Solar energy') {
    throw new Error(`Quiz A correctAnswer is incorrect: ${updatedCourse.lessons[0].quiz[0].correctAnswer}`);
  }

  // Assertions for Quiz B (Course level)
  if (updatedCourse.quiz.length !== 1) {
    throw new Error("Quiz B was not added to Course!");
  }
  if (updatedCourse.quiz[0].correctAnswer !== 'Lithium-ion') {
    throw new Error(`Quiz B correctAnswer is incorrect: ${updatedCourse.quiz[0].correctAnswer}`);
  }

  console.log("\nAll integration checks passed!");

  // Clean up
  await Course.deleteMany({ title: 'Integration Test Course' });
  await Quiz.deleteMany({ category: 'IntegrationTest' });
  await mongoose.disconnect();
  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===");
  process.exit(0);
}

testPublish().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
