const mongoose = require('mongoose');
const Course = require('./models/Course');

mongoose.connect('mongodb://localhost:27017/green_skills')
  .then(async () => {
    console.log('Connected to DB');

    const course = await Course.findOne({ title: 'Solar Panel Installation & Maintenance' }).lean();
    if (!course) {
      console.log('Course not found');
      process.exit(1);
    }

    let updated = false;

    if (course.quiz && Array.isArray(course.quiz)) {
      for (let i = 0; i < course.quiz.length; i++) {
        let q = course.quiz[i];
        if (q.question && q.question.includes('What is the correct procedure related to')) {
          console.log(`Fixing Question ${i + 1}...`)
          // Generate a simple generic question based on the options without AI
          q.question = `Which of the following concepts applies: ${q.options.slice(0, 2).map(o => o.substring(0, 15)).join(', ')}...?`;
          updated = true;
        }
      }
    }

    if (updated) {
      await Course.collection.updateOne({ _id: course._id }, { $set: { quiz: course.quiz } });
      console.log('Course updated with generic questions.');
    }

    console.log('Done');
    process.exit(0);
  });
