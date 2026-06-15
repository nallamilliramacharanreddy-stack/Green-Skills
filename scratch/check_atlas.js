const mongoose = require('../server/node_modules/mongoose');

const LOCAL_URI = 'mongodb://localhost:27017';

async function searchData() {
  console.log('Searching Local Databases...');
  try {
    await mongoose.connect(LOCAL_URI);
    const admin = mongoose.connection.db.admin();
    const dbsList = await admin.listDatabases();
    
    for (let dbObj of dbsList.databases) {
      const dbName = dbObj.name;
      if (['admin', 'local', 'config'].includes(dbName)) continue;
      
      const db = mongoose.connection.client.db(dbName);
      const collections = await db.listCollections().toArray();
      
      for (let coll of collections) {
        const collName = coll.name;
        if (collName === 'courses') {
          const courses = await db.collection(collName).find({}).toArray();
          courses.forEach(c => {
            const lessons = c.lessons || [];
            console.log(`[DB: ${dbName}] Course: "${c.title}" - Lessons: ${lessons.length}`);
            if (lessons.length > 5) {
              console.log(`  -> Found large course: "${c.title}" with ${lessons.length} lessons!`);
            }
          });
        }
        if (collName === 'quizzes') {
          const quizzes = await db.collection(collName).find({}).toArray();
          quizzes.forEach(q => {
            const questions = q.questions || [];
            console.log(`[DB: ${dbName}] Quiz: "${q.title}" - Questions: ${questions.length}`);
            if (questions.length > 5) {
              console.log(`  -> Found large quiz: "${q.title}" with ${questions.length} questions!`);
            }
          });
        }
        if (collName === 'videos') {
          const count = await db.collection(collName).countDocuments({});
          console.log(`[DB: ${dbName}] Found "videos" collection with ${count} items.`);
        }
      }
    }
  } catch (err) {
    console.error('Error searching databases:', err);
  } finally {
    await mongoose.disconnect();
  }
}

searchData();
