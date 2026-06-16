const mongoose = require('./server/node_modules/mongoose');
const Result = require('./server/models/Result');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = 'mongodb://127.0.0.1:27017/green_skills';

async function checkDetails() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const latestResults = await Result.find().sort({ completedAt: -1 }).limit(3);
  for (const res of latestResults) {
    console.log(`========================================`);
    console.log(`Result ID: ${res._id}`);
    console.log(`Completed At: ${res.completedAt}`);
    console.log(`Score: ${res.score} / ${res.totalQuestions}`);
    console.log(`Correct Count: ${res.correctCount}, Wrong Count: ${res.wrongCount}, Unattempted: ${res.notAttemptedCount}`);
    
    if (res.answers && res.answers.length > 0) {
      res.answers.forEach((ans, idx) => {
        console.log(`  Question #${idx + 1}: "${ans.questionText}"`);
        console.log(`    Options: ${JSON.stringify(ans.options)}`);
        console.log(`    Candidate Answer: ${JSON.stringify(ans.candidateAnswer)}`);
        console.log(`    Correct Answer: ${JSON.stringify(ans.correctAnswer)}`);
        console.log(`    isCorrect: ${ans.isCorrect}`);
      });
    } else {
      console.log('  No detailed answers stored!');
    }
  }

  await mongoose.disconnect();
}

checkDetails();
