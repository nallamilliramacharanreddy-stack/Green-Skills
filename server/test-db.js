const mongoose = require('mongoose');
const Course = require('./models/Course');
mongoose.connect('mongodb://localhost:27017/greenskills')
  .then(async () => {
    const courses = await Course.find();
    courses.forEach(c => {
      c.lessons.forEach(l => {
        if (l.directVideoUrl || l.internalVideoUrl) {
          console.log(l.title, "->", l.directVideoUrl || l.internalVideoUrl);
        }
      });
    });
    process.exit();
  });
