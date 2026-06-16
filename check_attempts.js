const mongoose = require('./server/node_modules/mongoose');
const Attempt = require('./server/models/Attempt');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = 'mongodb://127.0.0.1:27017/green_skills';

async function checkAttempts() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const latestAttempts = await Attempt.find().sort({ startedAt: -1 }).limit(5);
  for (const att of latestAttempts) {
    console.log(`========================================`);
    console.log(`Attempt ID: ${att._id}`);
    console.log(`User: ${att.user}`);
    console.log(`Course: ${att.course}`);
    console.log(`Quiz: ${att.quiz}`);
    console.log(`LessonIndex: ${att.lessonIndex}`);
    console.log(`IsCompleted: ${att.isCompleted}`);
    console.log(`Started At: ${att.startedAt}`);
    
    if (att.questions && att.questions.length > 0) {
      console.log(`  Questions Count: ${att.questions.length}`);
      att.questions.slice(0, 3).forEach((q, idx) => {
        console.log(`    Question #${idx + 1}: ${JSON.stringify(q)}`);
      });
    } else {
      console.log('  No questions stored in attempt!');
    }
  }

  await mongoose.disconnect();
}

checkAttempts();
