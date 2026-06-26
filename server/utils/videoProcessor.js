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
    const internalUrl = `http://localhost:5001/api/videos/stream/${videoId}`;

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

    // 3. Download if not exists or is empty
    const fileExists = fs.existsSync(filePath);
    const isFileEmpty = fileExists && fs.statSync(filePath).size === 0;

    if (!fileExists || isFileEmpty) {
      if (isFileEmpty) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      console.log(`[videoProcessor] Downloading video ${videoId} for course ${courseId}...`);
      try {
        const ytdl = require('@distube/ytdl-core');
        console.log(`[videoProcessor] Trying programmatic download via @distube/ytdl-core for ${videoId}`);
        await new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(filePath);
          const downloadStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, { 
            filter: 'audioandvideo', 
            quality: 'highestvideo' 
          });
          
          downloadStream.pipe(writeStream);
          
          writeStream.on('finish', () => {
            if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
              resolve();
            } else {
              reject(new Error('Downloaded file is empty'));
            }
          });
          
          downloadStream.on('error', (err) => {
            reject(err);
          });
          writeStream.on('error', (err) => {
            reject(err);
          });
        });
        console.log(`[videoProcessor] Successfully downloaded video ${videoId} via @distube/ytdl-core`);
      } catch (ytdlError) {
        console.error(`[videoProcessor] @distube/ytdl-core download failed: ${ytdlError.message || ytdlError}. Falling back to yt-dlp...`);
        // Clean up any 0-byte or partial file created by ytdl-core writeStream
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}

        const ytDlpPath = path.resolve(__dirname, '../node_modules/youtube-dl-exec/bin/yt-dlp');
        
        const runYtDlp = (cmd, args) => {
          return new Promise((resolve, reject) => {
            console.log(`[videoProcessor] Spawning: ${cmd} ${args.join(' ')}`);
            const subprocess = spawn(cmd, args);
            let stderrData = '';
            subprocess.stderr.on('data', (data) => {
              stderrData += data.toString();
            });
            subprocess.on('close', (code) => {
              if (code === 0 && fs.existsSync(filePath)) {
                resolve();
              } else {
                reject(new Error(`yt-dlp exited with code ${code}. Stderr: ${stderrData}`));
              }
            });
            subprocess.on('error', reject);
          });
        };

        try {
          await runYtDlp(ytDlpPath, [
            `https://www.youtube.com/watch?v=${videoId}`,
            '--format', 'best[ext=mp4]',
            '--output', filePath,
            '--no-check-certificates',
            '--force-ipv4'
          ]);
        } catch (execError) {
          console.error('[videoProcessor] yt-dlp default spawn failed, trying explicit python3...', execError.message || execError);
          // Clean up if partial file was created
          try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
          await runYtDlp('python3', [
            ytDlpPath,
            `https://www.youtube.com/watch?v=${videoId}`,
            '--format', 'best[ext=mp4]',
            '--output', filePath,
            '--no-check-certificates',
            '--force-ipv4'
          ]);
        }
      }
    }

    // 4. Upload to Cloudinary
    console.log(`[videoProcessor] Uploading ${videoId}.mp4 to Cloudinary...`);
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
    const cloudinaryUrl = uploadData.secure_url;
    console.log(`[videoProcessor] Cloudinary upload successful: ${cloudinaryUrl}`);

    // 5. Update Database on Success
    const stats = fs.statSync(filePath);
    await Course.findOneAndUpdate(
      { _id: courseId, 'lessons._id': lessonId },
      {
        $set: {
          'lessons.$.status': 'completed',
          'lessons.$.internalVideoUrl': cloudinaryUrl,
          'lessons.$.directVideoUrl': cloudinaryUrl,
          'lessons.$.file_size': stats.size,
          'lessons.$.processed_at': new Date()
        }
      }
    );
    console.log(`Successfully processed and uploaded video ${videoId}`);

  } catch (error) {
    console.error('Video processing failed:', error);
    await Course.findOneAndUpdate(
      { _id: courseId, 'lessons._id': lessonId },
      { $set: { 'lessons.$.status': 'failed' } }
    );
  }
};

module.exports = { processVideo };
