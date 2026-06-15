const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');

const videosDir = path.resolve(__dirname, '../uploads/videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

const processVideo = async (courseId, lessonId, youtubeLink) => {
  try {
    // 1. Extract Video ID
    let videoId = '';
    const watchMatch = youtubeLink.match(/[?&]v=([^&#]+)/);
    const shortMatch = youtubeLink.match(/youtu\.be\/([^?&#]+)/);
    const embedMatch = youtubeLink.match(/youtube\.com\/embed\/([^?&#]+)/);
    
    if (watchMatch) videoId = watchMatch[1];
    else if (shortMatch) videoId = shortMatch[1];
    else if (embedMatch) videoId = embedMatch[1];
    else {
      const parts = youtubeLink.split('/');
      videoId = parts[parts.length - 1].split('?')[0]; 
    }

    if (!videoId) throw new Error('Invalid YouTube URL');

    const filePath = path.join(videosDir, `${videoId}.mp4`);
    const baseUrl = process.env.API_URL || 'https://green-skills-api.onrender.com';
    const internalUrl = `${baseUrl}/api/videos/stream/${videoId}`;

    // 2. Mark as processing in DB
    await Course.findOneAndUpdate(
      { _id: courseId, 'lessons._id': lessonId },
      { 
        $set: { 
          'lessons.$.status': 'processing',
          'lessons.$.youtube_video_id': videoId
        } 
      }
    );

    // 3. Download if not exists
    if (!fs.existsSync(filePath)) {
      const ytDlpPath = path.resolve(__dirname, '../node_modules/youtube-dl-exec/bin/yt-dlp');
      
      const subprocess = spawn(ytDlpPath, [
        `https://www.youtube.com/watch?v=${videoId}`,
        '--format', 'best[ext=mp4]',
        '--output', filePath,
        '--no-check-certificates',
        '--force-ipv4',
        '--extractor-args', 'youtube:player_client=android'
      ]);

      await new Promise((resolve, reject) => {
        subprocess.on('close', (code) => {
          if (code === 0 && fs.existsSync(filePath)) {
            resolve();
          } else {
            reject(new Error(`yt-dlp exited with code ${code}`));
          }
        });
        subprocess.on('error', reject);
      });
    }

    // 4. Update Database on Success
    const stats = fs.statSync(filePath);
    await Course.findOneAndUpdate(
      { _id: courseId, 'lessons._id': lessonId },
      { 
        $set: { 
          'lessons.$.status': 'completed',
          'lessons.$.internalVideoUrl': internalUrl,
          'lessons.$.file_size': stats.size,
          'lessons.$.processed_at': new Date()
        } 
      }
    );
    console.log(`Successfully processed video ${videoId}`);

  } catch (error) {
    console.error('Video processing failed:', error);
    await Course.findOneAndUpdate(
      { _id: courseId, 'lessons._id': lessonId },
      { $set: { 'lessons.$.status': 'failed' } }
    );
  }
};

module.exports = { processVideo };
