const mongoose = require('mongoose');
const Course = require('./models/Course');
mongoose.connect('mongodb://localhost:27017/green_skills')
  .then(async () => {
    const courses = await Course.find();
    for (let c of courses) {
      let changed = false;
      for (let l of c.lessons) {
        if (l.internalVideoUrl && l.internalVideoUrl.includes('/uploads/videos/')) {
          l.internalVideoUrl = l.internalVideoUrl.replace('/uploads/videos/', '/api/videos/stream/');
          changed = true;
        }
        if (l.directVideoUrl && l.directVideoUrl.includes('/uploads/videos/')) {
          l.directVideoUrl = l.directVideoUrl.replace('/uploads/videos/', '/api/videos/stream/');
          changed = true;
        }
      }
      if (changed) {
        await c.save();
        console.log(`Updated course: ${c.title}`);
      }
    }
    console.log('Done!');
    process.exit();
  });
