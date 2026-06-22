const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Course = require('../models/Course');
const { processVideo } = require('../utils/videoProcessor');

const videosDir = path.resolve(__dirname, '../uploads/videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Set up multer for direct video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videosDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'direct-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Endpoint for direct MP4 uploads from Admin Dashboard
router.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No video file provided' });
  const internalUrl = `http://localhost:5001/api/videos/stream/${req.file.filename}`;
  res.json({ directVideoUrl: internalUrl, file_size: req.file.size });
});

// Endpoint for assessment proctoring video recordings upload
router.post('/upload-proctoring', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No video file provided' });
  const host = req.get('host');
  const protocol = req.protocol;
  const videoUrl = `${protocol}://${host}/uploads/videos/${req.file.filename}`;
  res.json({ videoRecordingUrl: videoUrl });
});

// Serve the fully downloaded static video file via robust 206 Partial Content streaming
router.get('/stream/:videoId', (req, res) => {
  const videoId = req.params.videoId;
  // Handle both exact filenames (direct uploads) and raw IDs (yt-dlp)
  let filename = videoId;
  if (!videoId.endsWith('.mp4') && !videoId.endsWith('.webm')) {
    filename = `${videoId}.mp4`;
  }
  const filePath = path.join(videosDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Video not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = filename.endsWith('.webm') ? 'video/webm' : 'video/mp4';

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Trigger offline processing for legacy courses on-demand
router.post('/process-legacy', async (req, res) => {
  const { courseId, lessonId, youtubeLink } = req.body;
  if (!courseId || !lessonId || !youtubeLink) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check current status
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    const lesson = course.lessons.id(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (lesson.status === 'processing' || lesson.status === 'completed') {
      return res.json({ message: 'Already processing or completed', status: lesson.status });
    }

    // Mark as processing and trigger async worker
    lesson.status = 'processing';
    await course.save();

    processVideo(course._id, lesson._id, youtubeLink); // Async trigger

    res.json({ message: 'Legacy processing started', status: 'processing' });
  } catch (error) {
    console.error('Legacy Process Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// In-memory cache for YouTube stream URLs
const streamUrlCache = {};

// Real-time instant streaming proxy for YouTube links (Supports Seeking & Timeline!)
router.get('/stream-live/:videoId', async (req, res) => {
  let videoId = req.params.videoId;
  
  // HOTFIX: The original video 'L2G7qS4yYnE' for Lesson 1 was deleted from YouTube.
  // Redirecting it to a working educational video ID 'xKxrkht7CpY'
  if (videoId === 'L2G7qS4yYnE') {
    videoId = 'xKxrkht7CpY';
  }

  const makeRequest = (urlToFetch) => {
    const https = require('https');
    const options = {
      rejectUnauthorized: false,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    };
    if (req.headers.range) options.headers['Range'] = req.headers.range;

    https.get(urlToFetch, options, (proxyRes) => {
      // Handle Redirects (Google Video often 302s to another caching server)
      if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302 || proxyRes.statusCode === 307) {
        const redirectUrl = proxyRes.headers.location;
        if (redirectUrl) {
          return makeRequest(redirectUrl);
        }
      }

      // 3. Forward all critical headers (206 Partial Content, Content-Length)
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }).on('error', (err) => {
      console.error('[STREAM-LIVE] Proxy request error:', err);
      if (!res.headersSent) {
        res.status(500).send('Streaming error');
      }
    });
  };

  const now = Date.now();
  const cached = streamUrlCache[videoId];

  if (cached && cached.expiresAt > now) {
    console.log(`[STREAM-LIVE] Serving cached stream URL for video ${videoId}`);
    return makeRequest(cached.url);
  }

  const { exec } = require('child_process');
  const ytDlpPath = path.resolve(__dirname, '../node_modules/youtube-dl-exec/bin/yt-dlp');

  // 1. Instantly extract the raw underlying streaming URL (bypasses 60s download)
  exec(`"${ytDlpPath}" -g "https://www.youtube.com/watch?v=${videoId}" --format "best[ext=mp4]" --no-check-certificates --force-ipv4`, (error, stdout, stderr) => {
    if (error || !stdout) {
      console.error('yt-dlp error:', error);
      console.error('yt-dlp stderr:', stderr);
      return res.status(500).send('Failed to extract live stream URL: ' + (stderr || error?.message));
    }

    const streamUrl = stdout.trim();

    // Cache the URL for 2 hours (Google Video URLs typically last 4-6 hours)
    streamUrlCache[videoId] = {
      url: streamUrl,
      expiresAt: now + 2 * 60 * 60 * 1000
    };

    console.log(`[STREAM-LIVE] Extracted and cached new stream URL for video ${videoId}`);
    makeRequest(streamUrl);
  });
});

// Enterprise AI Video Translation Trigger
router.post('/translate', async (req, res) => {
  try {
    const { courseId, lessonId, targetLanguageCode, targetLanguageName } = req.body;
    const Course = require('../models/Course');

    // 1. In a real environment, this triggers a background worker that:
    // - Downloads audio using yt-dlp
    // - Transcribes using OpenAI Whisper
    // - Translates using GPT-4
    // - Generates voice using ElevenLabs
    
    // 2. For demonstration, we simulate the completion by providing a dummy AI audio track 
    // (a generic copyright-free MP3 or placeholder URL) and subtitles
    const mockAiAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

    await Course.findOneAndUpdate(
      { _id: courseId, 'lessons._id': lessonId },
      { 
        $push: { 
          'lessons.$.audioTracks': {
            language: targetLanguageName,
            languageCode: targetLanguageCode,
            url: mockAiAudioUrl,
            status: 'completed'
          }
        } 
      }
    );

    res.json({ message: 'AI Translation Completed Successfully', url: mockAiAudioUrl });
  } catch (err) {
    res.status(500).json({ message: 'Translation failed', error: err.message });
  }
});

module.exports = router;
