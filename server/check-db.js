const mongoose = require('mongoose');
const Course = require('./models/Course');
mongoose.connect('mongodb://localhost:27017/green_skills').then(async () => {
    const course = await Course.findOne({ title: /Solar Panel/i });
    if (course) {
        course.lessons.forEach((l, index) => {
            console.log(`Video ${index + 1}: ${l.title} - YT: ${l.youtubeLink} - Internal: ${l.internalVideoUrl} - Direct: ${l.directVideoUrl}`);
        });
    }
    process.exit();
});
