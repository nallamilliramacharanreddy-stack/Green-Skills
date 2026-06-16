const mongoose = require('./server/node_modules/mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = 'mongodb://127.0.0.1:27017/green_skills';

async function printAllResultsSimple() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const db = mongoose.connection.db;
  const results = await db.collection('results').find().sort({ completedAt: -1 }).toArray();
  results.forEach((res, idx) => {
    console.log(`Result #${idx + 1}: ID=${res._id} User=${res.user} Course=${res.course} Score=${res.score}/${res.totalQuestions} Correct=${res.correctCount} Wrong=${res.wrongCount} Date=${res.completedAt}`);
    if (res.answers) {
      console.log(`  Answers count: ${res.answers.length}`);
      res.answers.forEach((ans, aIdx) => {
        console.log(`    Q #${aIdx + 1}: candidateAnswer=${JSON.stringify(ans.candidateAnswer)} correctAnswer=${JSON.stringify(ans.correctAnswer)} isCorrect=${ans.isCorrect}`);
      });
    }
  });

  await mongoose.disconnect();
}

printAllResultsSimple();
