require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Course = require('./models/Course');
const Result = require('./models/Result');
const TranslationHistory = require('./models/TranslationHistory');
const { uploadToCloudinary } = require('./utils/cloudinary');

const uploadsDir = path.resolve(__dirname, 'uploads');
const videosDir = path.resolve(__dirname, 'uploads/videos');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/green_skills';

/**
 * Resolves database local paths (e.g. /uploads/file.png or /api/videos/stream/video.mp4) to local file paths on disk.
 */
function resolveLocalPath(dbUrl) {
  if (!dbUrl || dbUrl.startsWith('http://') || dbUrl.startsWith('https://')) return null;

  if (dbUrl.includes('/uploads/videos/')) {
    const filename = dbUrl.split('/uploads/videos/')[1];
    return path.join(videosDir, filename);
  }
  if (dbUrl.includes('/api/videos/stream/')) {
    const filename = dbUrl.split('/api/videos/stream/')[1];
    return path.join(videosDir, filename);
  }
  if (dbUrl.includes('/uploads/')) {
    const filename = dbUrl.split('/uploads/')[1];
    return path.join(uploadsDir, filename);
  }

  // fallback if path is just the filename
  const p1 = path.join(uploadsDir, dbUrl);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(videosDir, dbUrl);
  if (fs.existsSync(p2)) return p2;

  return null;
}

async function runMigration() {
  console.log('Connecting to database:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  let migratedCount = 0;
  let skippedCount = 0;
  let fileNotFoundCount = 0;

  // 1. Migrate Users (profilePicture and companyDocument)
  console.log('\n--- Migrating Users ---');
  const users = await User.find({});
  for (const user of users) {
    let updated = false;

    // Profile Picture
    if (user.profilePicture && !user.profilePicture.includes('cloudinary.com') && !user.profilePicture.startsWith('http')) {
      const localFile = resolveLocalPath(user.profilePicture);
      if (localFile && fs.existsSync(localFile)) {
        try {
          console.log(`[User] Uploading profile picture for ${user.email} (${localFile})...`);
          const uploadRes = await uploadToCloudinary(localFile, 'profiles', 'image');
          user.profilePicture = uploadRes.secure_url;
          user.profilePicturePublicId = uploadRes.public_id;
          updated = true;
          migratedCount++;
        } catch (err) {
          console.error(`[User] Failed to upload profile picture for ${user.email}:`, err.message);
        }
      } else {
        console.warn(`[User] Profile picture file not found on disk for ${user.email}: ${user.profilePicture}`);
        fileNotFoundCount++;
      }
    } else if (user.profilePicture) {
      skippedCount++;
    }

    // Company Document
    if (user.companyDetails && user.companyDetails.companyDocument && !user.companyDetails.companyDocument.includes('cloudinary.com') && !user.companyDetails.companyDocument.startsWith('http')) {
      const localFile = resolveLocalPath(user.companyDetails.companyDocument);
      if (localFile && fs.existsSync(localFile)) {
        try {
          console.log(`[User] Uploading company document for ${user.email} (${localFile})...`);
          const isImage = /\.(jpg|jpeg|png|webp)$/i.test(localFile);
          const uploadRes = await uploadToCloudinary(localFile, 'documents', isImage ? 'image' : 'raw');
          user.companyDetails.companyDocument = uploadRes.secure_url;
          user.companyDetails.companyDocumentPublicId = uploadRes.public_id;
          updated = true;
          migratedCount++;
        } catch (err) {
          console.error(`[User] Failed to upload company document for ${user.email}:`, err.message);
        }
      } else {
        console.warn(`[User] Company document file not found on disk for ${user.email}: ${user.companyDetails.companyDocument}`);
        fileNotFoundCount++;
      }
    } else if (user.companyDetails && user.companyDetails.companyDocument) {
      skippedCount++;
    }

    if (updated) {
      await user.save();
      console.log(`[User] Saved updates for ${user.email}`);
    }
  }

  // 2. Migrate Course Lessons (directVideoUrl and internalVideoUrl)
  console.log('\n--- Migrating Courses ---');
  const courses = await Course.find({});
  for (const course of courses) {
    let updated = false;

    if (course.lessons && course.lessons.length > 0) {
      for (const lesson of course.lessons) {
        // Direct Video
        if (lesson.directVideoUrl && !lesson.directVideoUrl.includes('cloudinary.com') && !lesson.directVideoUrl.startsWith('http')) {
          const localFile = resolveLocalPath(lesson.directVideoUrl);
          if (localFile && fs.existsSync(localFile)) {
            try {
              console.log(`[Course] Uploading direct video for course: "${course.title}" -> lesson: "${lesson.title}" (${localFile})...`);
              const uploadRes = await uploadToCloudinary(localFile, 'lessons', 'video');
              lesson.directVideoUrl = uploadRes.secure_url;
              lesson.directVideoPublicId = uploadRes.public_id;
              updated = true;
              migratedCount++;
            } catch (err) {
              console.error(`[Course] Failed to upload direct video for lesson "${lesson.title}":`, err.message);
            }
          } else {
            console.warn(`[Course] Direct video file not found on disk for lesson "${lesson.title}": ${lesson.directVideoUrl}`);
            fileNotFoundCount++;
          }
        } else if (lesson.directVideoUrl) {
          skippedCount++;
        }

        // Internal Video
        if (lesson.internalVideoUrl && !lesson.internalVideoUrl.includes('cloudinary.com') && !lesson.internalVideoUrl.startsWith('http')) {
          const localFile = resolveLocalPath(lesson.internalVideoUrl);
          if (localFile && fs.existsSync(localFile)) {
            try {
              console.log(`[Course] Uploading internal video for course: "${course.title}" -> lesson: "${lesson.title}" (${localFile})...`);
              const uploadRes = await uploadToCloudinary(localFile, 'lessons', 'video');
              lesson.internalVideoUrl = uploadRes.secure_url;
              lesson.internalVideoPublicId = uploadRes.public_id;
              updated = true;
              migratedCount++;
            } catch (err) {
              console.error(`[Course] Failed to upload internal video for lesson "${lesson.title}":`, err.message);
            }
          } else {
            console.warn(`[Course] Internal video file not found on disk for lesson "${lesson.title}": ${lesson.internalVideoUrl}`);
            fileNotFoundCount++;
          }
        } else if (lesson.internalVideoUrl) {
          skippedCount++;
        }
      }
    }

    if (updated) {
      course.markModified('lessons');
      await course.save();
      console.log(`[Course] Saved updates for course "${course.title}"`);
    }
  }

  // 3. Migrate Results (videoRecordingUrl)
  console.log('\n--- Migrating Results ---');
  const results = await Result.find({});
  for (const resItem of results) {
    let updated = false;

    if (resItem.videoRecordingUrl && !resItem.videoRecordingUrl.includes('cloudinary.com') && !resItem.videoRecordingUrl.startsWith('http')) {
      const localFile = resolveLocalPath(resItem.videoRecordingUrl);
      if (localFile && fs.existsSync(localFile)) {
        try {
          console.log(`[Result] Uploading proctoring video for result ID ${resItem._id} (${localFile})...`);
          const uploadRes = await uploadToCloudinary(localFile, 'proctoring', 'video');
          resItem.videoRecordingUrl = uploadRes.secure_url;
          resItem.videoRecordingPublicId = uploadRes.public_id;
          updated = true;
          migratedCount++;
        } catch (err) {
          console.error(`[Result] Failed to upload proctoring video for result ${resItem._id}:`, err.message);
        }
      } else {
        console.warn(`[Result] Proctoring video file not found on disk for result ${resItem._id}: ${resItem.videoRecordingUrl}`);
        fileNotFoundCount++;
      }
    } else if (resItem.videoRecordingUrl) {
      skippedCount++;
    }

    if (updated) {
      await resItem.save();
      console.log(`[Result] Saved updates for result ID ${resItem._id}`);
    }
  }

  // 4. Migrate TranslationHistory (translatedVideoUrl, srtUrl, vttUrl)
  console.log('\n--- Migrating Translation History ---');
  const histories = await TranslationHistory.find({});
  for (const hist of histories) {
    let updated = false;

    // Translated Video
    if (hist.translatedVideoUrl && !hist.translatedVideoUrl.includes('cloudinary.com') && !hist.translatedVideoUrl.startsWith('http')) {
      const localFile = resolveLocalPath(hist.translatedVideoUrl);
      if (localFile && fs.existsSync(localFile)) {
        try {
          console.log(`[TranslationHistory] Uploading video for ${hist.videoName} (${localFile})...`);
          const uploadRes = await uploadToCloudinary(localFile, 'translations/videos', 'video');
          hist.translatedVideoUrl = uploadRes.secure_url;
          hist.translatedVideoPublicId = uploadRes.public_id;
          updated = true;
          migratedCount++;
        } catch (err) {
          console.error(`[TranslationHistory] Failed to upload video for ${hist.videoName}:`, err.message);
        }
      } else {
        console.warn(`[TranslationHistory] Video file not found on disk for history ${hist.videoName}: ${hist.translatedVideoUrl}`);
        fileNotFoundCount++;
      }
    } else if (hist.translatedVideoUrl) {
      skippedCount++;
    }

    // SRT Subtitles
    if (hist.srtUrl && !hist.srtUrl.includes('cloudinary.com') && !hist.srtUrl.startsWith('http')) {
      const localFile = resolveLocalPath(hist.srtUrl);
      if (localFile && fs.existsSync(localFile)) {
        try {
          console.log(`[TranslationHistory] Uploading SRT subtitles for ${hist.videoName} (${localFile})...`);
          const uploadRes = await uploadToCloudinary(localFile, 'translations/subtitles', 'raw');
          hist.srtUrl = uploadRes.secure_url;
          hist.srtPublicId = uploadRes.public_id;
          updated = true;
          migratedCount++;
        } catch (err) {
          console.error(`[TranslationHistory] Failed to upload SRT for ${hist.videoName}:`, err.message);
        }
      } else {
        console.warn(`[TranslationHistory] SRT file not found on disk for history ${hist.videoName}: ${hist.srtUrl}`);
        fileNotFoundCount++;
      }
    } else if (hist.srtUrl) {
      skippedCount++;
    }

    // VTT Subtitles
    if (hist.vttUrl && !hist.vttUrl.includes('cloudinary.com') && !hist.vttUrl.startsWith('http')) {
      const localFile = resolveLocalPath(hist.vttUrl);
      if (localFile && fs.existsSync(localFile)) {
        try {
          console.log(`[TranslationHistory] Uploading VTT subtitles for ${hist.videoName} (${localFile})...`);
          const uploadRes = await uploadToCloudinary(localFile, 'translations/subtitles', 'raw');
          hist.vttUrl = uploadRes.secure_url;
          hist.vttPublicId = uploadRes.public_id;
          updated = true;
          migratedCount++;
        } catch (err) {
          console.error(`[TranslationHistory] Failed to upload VTT for ${hist.videoName}:`, err.message);
        }
      } else {
        console.warn(`[TranslationHistory] VTT file not found on disk for history ${hist.videoName}: ${hist.vttUrl}`);
        fileNotFoundCount++;
      }
    } else if (hist.vttUrl) {
      skippedCount++;
    }

    if (updated) {
      await hist.save();
      console.log(`[TranslationHistory] Saved updates for ${hist.videoName}`);
    }
  }

  console.log('\n--- Migration Run Complete ---');
  console.log(`Successfully migrated: ${migratedCount}`);
  console.log(`Skipped (already on Cloudinary/External): ${skippedCount}`);
  console.log(`Local files not found on disk: ${fileNotFoundCount}`);

  await mongoose.disconnect();
  console.log('Database disconnected.');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
