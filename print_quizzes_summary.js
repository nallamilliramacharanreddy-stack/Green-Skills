const mongoose = require('./server/node_modules/mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = 'mongodb://127.0.0.1:27017/green_skills';

async function printQuizzesSummary() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const db = mongoose.connection.db;
  const quizzes = await db.collection('quizzes').find().toArray();
  quizzes.forEach((q, idx) => {
    console.log(`Quiz #${idx + 1}: ID=${q._id} Title="${q.title}"`);
    if (q.questions) {
      q.questions.forEach((qu, qIdx) => {
        console.log(`  Question #${qIdx + 1}: "${qu.questionText || qu.question}"`);
        console.log(`    Options: ${JSON.stringify(qu.options)}`);
        console.log(`    Type: ${qu.questionType}`);
        console.log(`    Correct: ${JSON.stringify(qu.correctAnswer)}`);
      });
    }
  });

  await mongoose.disconnect();
}

printQuizzesSummary();
