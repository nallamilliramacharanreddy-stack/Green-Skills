const mongoose = require('mongoose');
const Course = require('./models/Course');

const REMOTE_API = 'https://green-skills-api.onrender.com/api/courses';

async function sync() {
  await mongoose.connect('mongodb://localhost:27017/green_skills');
  const localCourses = await Course.find({}).lean();
  console.log(`Found ${localCourses.length} local courses.`);

  // Get remote courses
  const response = await fetch(REMOTE_API);
  const remoteCourses = await response.json();

  for (let localCourse of localCourses) {
    // We don't want to mess up IDs, so we remove _id and __v
    let { _id, __v, ...courseData } = localCourse;

    // Fix localhost URLs for production:
    // If a lesson has a youtubeLink, we strip the internalVideoUrl 
    // so production cleanly falls back to the native YouTube iframe 
    // instead of trying to load localhost:5001 or missing MP4s
    if (courseData.lessons) {
      courseData.lessons = courseData.lessons.map(lesson => {
        if (lesson.youtubeLink) {
          lesson.internalVideoUrl = null;
          lesson.directVideoUrl = null;
        }
        return lesson;
      });
    }

    let remoteCourse = remoteCourses.find(c => c.title === localCourse.title);
    
    if (remoteCourse) {
      console.log(`Updating remote course: ${localCourse.title}`);
      try {
        await fetch(`${REMOTE_API}/${remoteCourse._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
        });
        console.log(`Successfully updated ${localCourse.title}`);
      } catch (err) {
        console.error(`Failed to update ${localCourse.title}:`, err.message);
      }
    } else {
      console.log(`Creating remote course: ${localCourse.title}`);
      try {
        await fetch(REMOTE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
        });
        console.log(`Successfully created ${localCourse.title}`);
      } catch (err) {
        console.error(`Failed to create ${localCourse.title}:`, err.message);
      }
    }
  }

  console.log('Sync complete.');
  process.exit(0);
}

sync();
