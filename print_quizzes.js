const mongoose = require('./server/node_modules/mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = 'mongodb://127.0.0.1:27017/green_skills';

async function printQuizzes() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const db = mongoose.connection.db;
  const quizzes = await db.collection('quizzes').find().toArray();
  console.log(JSON.stringify(quizzes, null, 2));

  await mongoose.disconnect();
}

printQuizzes();
