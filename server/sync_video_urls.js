/**
 * sync_video_urls.js
 * 
 * Scans all courses in the database.
 * For each lesson with a youtubeLink, checks if the MP4 file already exists
 * in uploads/videos/. If it does, sets the internalVideoUrl so the client
 * uses the native <video> player instead of the YouTube embed.
 * 
 * Usage: node sync_video_urls.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Course = require('./models/Course');

const videosDir = path.resolve(__dirname, 'uploads/videos');
const SERVER_BASE = process.env.SERVER_URL || 'http://localhost:5001';

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

async function syncVideoUrls() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills');
  console.log('Connected to MongoDB');

  const courses = await Course.find({});
  let updated = 0;
  let alreadySet = 0;
  let noFile = 0;

  for (const course of courses) {
    let courseModified = false;

    for (const lesson of course.lessons) {
      // Skip lessons that already have an internalVideoUrl set
      if (lesson.internalVideoUrl) {
        alreadySet++;
        continue;
      }

      // Skip lessons with no YouTube link
      if (!lesson.youtubeLink) continue;

      const videoId = extractVideoId(lesson.youtubeLink);
      if (!videoId) continue;

      const filePath = path.join(videosDir, `${videoId}.mp4`);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        lesson.internalVideoUrl = `${SERVER_BASE}/api/videos/stream/${videoId}`;
        lesson.youtube_video_id = videoId;
        lesson.status = 'completed';
        lesson.file_size = stats.size;
        lesson.processed_at = new Date();
        courseModified = true;
        updated++;
        console.log(`  ✅ ${course.title} → "${lesson.title}" → ${videoId}.mp4 (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
      } else {
        noFile++;
        console.log(`  ⚠️  ${course.title} → "${lesson.title}" → ${videoId}.mp4 NOT FOUND`);
      }
    }

    if (courseModified) {
      await course.save();
      console.log(`  💾 Saved course: ${course.title}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Already set:  ${alreadySet}`);
  console.log(`Updated:      ${updated}`);
  console.log(`No file:      ${noFile}`);
  console.log(`Total lessons scanned: ${alreadySet + updated + noFile}`);

  await mongoose.disconnect();
  console.log('Done.');
}

syncVideoUrls().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
