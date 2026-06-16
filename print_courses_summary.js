const mongoose = require('./server/node_modules/mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = 'mongodb://127.0.0.1:27017/green_skills';

async function printCoursesSummary() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const db = mongoose.connection.db;
  const courses = await db.collection('courses').find().toArray();
  courses.forEach((c, idx) => {
    console.log(`Course #${idx + 1}: ID=${c._id} Title="${c.title}"`);
    if (c.quiz) {
      console.log(`  Course Quiz Questions Count: ${c.quiz.length}`);
      c.quiz.forEach((q, qIdx) => {
        console.log(`    Quiz Q #${qIdx + 1}: "${q.question}"`);
        console.log(`      Options: ${JSON.stringify(q.options)}`);
        console.log(`      Correct: ${JSON.stringify(q.correctAnswer)}`);
      });
    }
    if (c.lessons) {
      console.log(`  Lessons Count: ${c.lessons.length}`);
      c.lessons.forEach((l, lIdx) => {
        console.log(`    Lesson #${lIdx + 1}: Title="${l.title}"`);
        if (l.quiz) {
          console.log(`      Lesson Quiz Questions Count: ${l.quiz.length}`);
          l.quiz.forEach((q, qIdx) => {
            console.log(`        Lesson Quiz Q #${qIdx + 1}: "${q.question}"`);
            console.log(`          Options: ${JSON.stringify(q.options)}`);
            console.log(`          Correct: ${JSON.stringify(q.correctAnswer)}`);
          });
        }
      });
    }
  });

  await mongoose.disconnect();
}

printCoursesSummary();
