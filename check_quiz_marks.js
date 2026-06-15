const mongoose = require('./server/node_modules/mongoose');
const Result = require('./server/models/Result');
const User = require('./server/models/User');
const Course = require('./server/models/Course');
const Quiz = require('./server/models/Quiz');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/green_skills';

async function fetchMarks() {
  console.log('Connecting to:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Database successfully!\n');
  } catch (err) {
    console.error('Failed to connect:', err);
    process.exit(1);
  }

  try {
    // 1. Fetch from Result collection
    console.log('--- QUIZ RESULTS (FROM RESULT COLLECTION) ---');
    const results = await Result.find()
      .populate('user', 'name email role')
      .populate('course', 'title category');

    if (results.length === 0) {
      console.log('No records found in the Result collection.\n');
    } else {
      results.forEach((res, index) => {
        console.log(`[Result #${index + 1}]`);
        console.log(`  User: ${res.user ? `${res.user.name} (${res.user.email})` : 'Unknown User'}`);
        console.log(`  Course/Quiz: ${res.course ? res.course.title : 'Unknown Course'}`);
        console.log(`  Score: ${res.score} / ${res.totalQuestions} (${res.totalQuestions > 0 ? Math.round((res.score / res.totalQuestions) * 100) : 0}%)`);
        console.log(`  Status: ${res.status}`);
        console.log(`  Trust Score: ${res.trustScore}% | Warnings: ${res.warnings}`);
        console.log(`  Submission Type: ${res.submissionType}`);
        console.log(`  Completed At: ${res.completedAt}`);
        console.log('----------------------------------------------------');
      });
      console.log();
    }

    // 2. Fetch from User collection (quizScores)
    console.log('--- USER QUIZ SCORES (FROM USER COLLECTION) ---');
    const users = await User.find({ quizScores: { $exists: true, $not: { $size: 0 } } })
      .populate('quizScores.courseId', 'title');

    if (users.length === 0) {
      console.log('No user has any quizScores stored in their user document.');
    } else {
      users.forEach(user => {
        console.log(`User: ${user.name} (${user.email})`);
        user.quizScores.forEach((qs, index) => {
          console.log(`  Quiz #${index + 1}:`);
          console.log(`    Course/Quiz: ${qs.courseId ? qs.courseId.title : 'Unknown Course'}`);
          console.log(`    Score: ${qs.score} / ${qs.totalQuestions}`);
          console.log(`    Completed At: ${qs.completedAt}`);
        });
        console.log('----------------------------------------------------');
      });
    }

  } catch (err) {
    console.error('Error fetching quiz marks:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from Database.');
  }
}

fetchMarks();
