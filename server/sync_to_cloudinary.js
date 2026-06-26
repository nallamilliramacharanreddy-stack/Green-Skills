require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Course = require('./models/Course');

const videosDir = path.resolve(__dirname, 'uploads/videos');

function extractVideoId(url) {
  if (!url) return null;
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&#]+)/);
  if (watchMatch) return watchMatch[1];
  if (shortMatch) return shortMatch[1];
  if (embedMatch) return embedMatch[1];
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

async function uploadToCloudinary(filePath, videoId) {
  console.log(`  [Cloudinary] Uploading local file for ${videoId}...`);
  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'video/mp4' }), `${videoId}.mp4`);
  formData.append('upload_preset', 'green_skills_preset');

  const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dkxww8bsy/video/upload', {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Cloudinary upload failed: ${uploadRes.status} ${errText}`);
  }

  const uploadData = await uploadRes.json();
  return uploadData.secure_url;
}

async function syncToCloudinary() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills');
  console.log('Connected to MongoDB');

  const courses = await Course.find({});
  let uploadedCount = 0;
  let alreadyCloudinary = 0;
  let missingFiles = 0;

  for (const course of courses) {
    let courseModified = false;

    for (const lesson of course.lessons) {
      // If it's already a Cloudinary URL, skip
      if (lesson.internalVideoUrl && lesson.internalVideoUrl.includes('cloudinary.com')) {
        alreadyCloudinary++;
        continue;
      }

      const videoId = extractVideoId(lesson.youtubeLink || lesson.internalVideoUrl || lesson.directVideoUrl);
      if (!videoId) continue;

      const filePath = path.join(videosDir, `${videoId}.mp4`);

      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        try {
          const stats = fs.statSync(filePath);
          const cloudinaryUrl = await uploadToCloudinary(filePath, videoId);
          
          lesson.internalVideoUrl = cloudinaryUrl;
          lesson.directVideoUrl = cloudinaryUrl;
          lesson.youtube_video_id = videoId;
          lesson.status = 'completed';
          lesson.file_size = stats.size;
          lesson.processed_at = new Date();
          
          courseModified = true;
          uploadedCount++;
          console.log(`  ✅ Successfully uploaded and synced: ${course.title} → "${lesson.title}" → ${cloudinaryUrl}`);
        } catch (uploadErr) {
          console.error(`  ❌ Failed to upload ${videoId}:`, uploadErr.message);
        }
      } else {
        missingFiles++;
        console.log(`  ⚠️ Local file missing for ${course.title} → "${lesson.title}" (ID: ${videoId})`);
      }
    }

    if (courseModified) {
      await course.save();
      console.log(`  💾 Saved course updates: ${course.title}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Already on Cloudinary: ${alreadyCloudinary}`);
  console.log(`Uploaded to Cloudinary: ${uploadedCount}`);
  console.log(`Local files missing: ${missingFiles}`);

  await mongoose.disconnect();
  console.log('Done.');
}

syncToCloudinary().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
