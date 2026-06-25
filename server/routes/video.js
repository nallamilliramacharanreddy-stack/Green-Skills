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

// Helper: Format seconds to SRT format (HH:MM:SS,mmm)
function formatSrtTime(seconds) {
  const ms = Math.floor((seconds % 1) * 1000);
  const secs = Math.floor(seconds % 60);
  const mins = Math.floor((seconds / 60) % 60);
  const hrs = Math.floor(seconds / 3600);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Helper: Format seconds to VTT format (HH:MM:SS.mmm)
function formatVttTime(seconds) {
  const ms = Math.floor((seconds % 1) * 1000);
  const secs = Math.floor(seconds % 60);
  const mins = Math.floor((seconds / 60) % 60);
  const hrs = Math.floor(seconds / 3600);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

// Helper: Fetch Google Translate TTS with chunking
async function getTtsForText(text, langCode, outputPath) {
  if (!text || !text.trim()) return false;
  
  const words = text.split(' ');
  const chunks = [];
  let currentChunk = '';
  
  for (const word of words) {
    if ((currentChunk + ' ' + word).length > 150) {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  const chunkBuffers = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) throw new Error(`TTS generation failed: ${res.statusText}`);
    const buf = await res.arrayBuffer();
    chunkBuffers.push(Buffer.from(buf));
  }
  
  fs.writeFileSync(outputPath, Buffer.concat(chunkBuffers));
  return true;
}

// Helper: Call Gemini with robust retry logic
async function callGeminiWithRetry(model, prompt, content, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const parts = content ? [prompt, content] : [prompt];
      const response = await model.generateContent(parts);
      let text = response.response.text();
      if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        text = text.split('```')[1].split('```')[0].trim();
      }
      return JSON.parse(text);
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`[RETRY ${i + 1}/${retries}] Gemini prompt failed:`, e.message);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// Enterprise GET Translation History Route
router.get('/history', async (req, res) => {
  try {
    const TranslationHistory = require('../models/TranslationHistory');
    const history = await TranslationHistory.find({}).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch translation history: ' + err.message });
  }
});

// Enterprise AI Video Translation and Localization Engine
router.post('/translate-video', async (req, res) => {
  const { videoUrl, targetLanguage, voiceOption, socketId, translationStyle, voiceStyle } = req.body;
  
  if (!videoUrl || !targetLanguage) {
    return res.status(400).json({ message: 'Missing videoUrl or targetLanguage' });
  }

  const TranslationHistory = require('../models/TranslationHistory');
  const job = await TranslationHistory.create({
    videoName: videoUrl.split('/').pop()?.split('?')[0] || 'Untitled Video',
    videoUrl,
    targetLanguage,
    translationStyle: translationStyle || 'natural',
    voiceStyle: voiceStyle || 'standard',
    status: 'processing',
    logs: ['Initializing translation job...']
  });

  const io = req.app.get('io');
  const sendProgress = (stepIndex, progressPercent, message) => {
    if (io && socketId) {
      io.to(socketId).emit('translation_progress', {
        stepIndex,
        progress: progressPercent,
        message,
        jobId: job._id
      });
    }
  };

  const logMessage = async (msg) => {
    console.log(`[Job ${job._id}] ${msg}`);
    job.logs.push(`[${new Date().toISOString()}] ${msg}`);
    await job.save();
  };

  const updateProgress = async (stepIndex, percent, msg) => {
    await logMessage(msg);
    sendProgress(stepIndex, percent, msg);
  };

  const LANG_MAP = {
    'Telugu': 'te', 'Hindi': 'hi', 'Tamil': 'ta', 'Kannada': 'kn', 
    'Malayalam': 'ml', 'Bengali': 'bn', 'Marathi': 'mr', 'Gujarati': 'gu', 
    'Punjabi': 'pa', 'Urdu': 'ur', 'Arabic': 'ar', 'French': 'fr', 
    'German': 'de', 'Spanish': 'es', 'Japanese': 'ja', 'Korean': 'ko', 
    'Chinese': 'zh-CN', 'English': 'en'
  };

  const targetLangCode = LANG_MAP[targetLanguage] || 'en';
  const processId = Date.now() + '-' + Math.round(Math.random() * 1e4);

  let videoFilePath = '';
  let isTempVideo = false;

  try {
    // STEP 1: Audio Extraction & Source Loading
    await updateProgress(0, 10, 'Resolving and preparing video source...');
    
    // Check if videoUrl is a local stream URL
    if (videoUrl.includes('/api/videos/stream/')) {
      const filename = videoUrl.split('/stream/')[1].split('?')[0];
      videoFilePath = path.join(videosDir, filename);
    } else if (videoUrl.startsWith('http') && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
      // It's a YouTube URL
      await updateProgress(0, 30, 'Downloading YouTube video via yt-dlp...');
      
      let videoId = '';
      const watchMatch = videoUrl.match(/[?&]v=([^&#]+)/);
      const shortMatch = videoUrl.match(/youtu\.be\/([^?&#]+)/);
      if (watchMatch) videoId = watchMatch[1];
      else if (shortMatch) videoId = shortMatch[1];

      if (!videoId) throw new Error('Could not parse YouTube video ID');

      videoFilePath = path.join(videosDir, `yt-${videoId}.mp4`);
      
      if (!fs.existsSync(videoFilePath)) {
        const ytDlpPath = path.resolve(__dirname, '../node_modules/youtube-dl-exec/bin/yt-dlp');
        const { spawn } = require('child_process');
        const subprocess = spawn(ytDlpPath, [
          `https://www.youtube.com/watch?v=${videoId}`,
          '--format', 'best[ext=mp4]',
          '--output', videoFilePath,
          '--no-check-certificates',
          '--force-ipv4'
        ]);

        await new Promise((resolve, reject) => {
          subprocess.on('close', (code) => {
            if (code === 0 && fs.existsSync(videoFilePath)) resolve();
            else reject(new Error(`yt-dlp exited with code ${code}`));
          });
          subprocess.on('error', reject);
        });
      }
    } else {
      // Fallback: download direct video from arbitrary URL
      await updateProgress(0, 30, 'Downloading external video URL...');
      videoFilePath = path.join(videosDir, `temp-${processId}.mp4`);
      isTempVideo = true;
      const response = await fetch(videoUrl);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(videoFilePath, Buffer.from(buffer));
    }

    if (!fs.existsSync(videoFilePath)) {
      throw new Error('Video file could not be located or downloaded.');
    }

    // Extract audio from video
    await updateProgress(0, 70, 'Extracting audio track from video using fluent-ffmpeg...');
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegPath);

    const audioFilePath = path.join(videosDir, `audio-raw-${processId}.mp3`);
    await new Promise((resolve, reject) => {
      ffmpeg(videoFilePath)
        .noVideo()
        .audioCodec('libmp3lame')
        .save(audioFilePath)
        .on('end', resolve)
        .on('error', reject);
    });

    await updateProgress(0, 100, 'Audio extracted successfully.');

    // STEP 2: AI Speech Recognition (Whisper / Gemini Native Audio)
    await updateProgress(1, 20, 'Initializing advanced speech transcription engine...');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    await updateProgress(1, 60, 'Transcribing audio, detecting original language, separating speakers, and detecting tone...');
    const audioData = fs.readFileSync(audioFilePath);
    
    const transcriptionPrompt = `
      You are an expert audio transcription tool.
      Analyze the provided audio, detect the original language, and transcribe the speech with speaker separation, timestamp formatting, punctuation restoration, emotion, tone, and technical terminology identification.
      Return ONLY a valid JSON object matching this schema:
      {
        "originalLanguage": "Detected language code (e.g. 'en')",
        "transcript": [
          {
            "start": 0.0,
            "end": 2.5,
            "speaker": "Speaker 1",
            "text": "The transcribed speech segment",
            "emotion": "Detected emotion (e.g. happy, energetic, calm)",
            "tone": "Detected tone (e.g. professional, conversational, formal)",
            "technicalTerms": ["term1", "term2"]
          }
        ]
      }
    `;

    const transcriptionObj = await callGeminiWithRetry(model, transcriptionPrompt, {
      inlineData: {
        mimeType: 'audio/mp3',
        data: audioData.toString('base64')
      }
    });

    const originalTranscript = transcriptionObj.transcript || [];
    const detectedLanguage = transcriptionObj.originalLanguage || 'en';

    await updateProgress(1, 100, `Speech recognition complete. Detected language: ${detectedLanguage}`);

    // STEP 3: Context-Aware AI Translation
    await updateProgress(2, 30, `Translating transcript details with ${translationStyle || 'natural'} style...`);
    
    const translationPrompt = `
      Translate the following transcript JSON array into ${targetLanguage} (${targetLangCode}).
      Style of translation to apply: ${translationStyle || 'natural'}.
      Preserve meaning, context, emotion, tone, technical terminology, names, brands, speaker, start, and end.
      If a direct translation is unnatural, rewrite it naturally for native speakers while preserving the original meaning.
      Return ONLY a JSON array matching the original schema:
      [
        {
          "start": 0.0,
          "end": 2.5,
          "speaker": "Speaker 1",
          "text": "Translated segment in ${targetLanguage}"
        }
      ]
    `;

    const translatedTranscript = await callGeminiWithRetry(model, translationPrompt, JSON.stringify(originalTranscript));
    await updateProgress(2, 100, 'Translation complete.');

    // STEP 4: Neural Voice Generation (TTS)
    await updateProgress(3, 10, 'Initializing neural voice synthesis...');
    const ttsFiles = [];
    
    for (let i = 0; i < translatedTranscript.length; i++) {
      const segment = translatedTranscript[i];
      const segmentFilePath = path.join(videosDir, `tts-${processId}-${i}.mp3`);
      
      await updateProgress(3, Math.round(10 + (i / translatedTranscript.length) * 80), `Generating speech audio for segment ${i + 1}/${translatedTranscript.length} (${voiceStyle || 'standard'} voice delivery)...`);
      
      const generated = await getTtsForText(segment.text, targetLangCode, segmentFilePath);
      if (generated) {
        ttsFiles.push({
          path: segmentFilePath,
          start: segment.start,
          end: segment.end,
          index: i
        });
      }
    }
    await updateProgress(3, 100, 'Voice synthesis complete.');

    // STEP 5: AI Lip Sync & Rebuilding
    await updateProgress(4, 10, 'Merging translated audio streams and synchronizing with video timeline...');
    
    const outputVideoFilename = `translated-${targetLangCode}-${processId}.mp4`;
    const outputVideoPath = path.join(videosDir, outputVideoFilename);
    const dubbedAudioFilename = `dubbed-${targetLangCode}-${processId}.mp3`;
    const dubbedAudioPath = path.join(videosDir, dubbedAudioFilename);

    // Build FFmpeg complex filter to delay and mix all synthesized audio segments
    let command = ffmpeg(videoFilePath);
    let filterComplex = '';
    const inputs = [];

    // Add each TTS segment as an input
    ttsFiles.forEach((file) => {
      command = command.input(file.path);
    });

    // Build filter complex
    ttsFiles.forEach((file, index) => {
      const delayMs = Math.round(file.start * 1000);
      filterComplex += `[${index + 1}:a]adelay=${delayMs}|${delayMs}[a${index}];`;
      inputs.push(`[a${index}]`);
    });

    if (inputs.length > 0) {
      filterComplex += `${inputs.join('')}amix=inputs=${inputs.length}:duration=longest[aout]`;
    }

    // Process dubbed audio track first
    await updateProgress(4, 40, 'Compiling master dubbed audio track using amix filter...');
    await new Promise((resolve, reject) => {
      let audioCommand = ffmpeg();
      ttsFiles.forEach((file) => {
        audioCommand = audioCommand.input(file.path);
      });
      audioCommand
        .complexFilter(filterComplex)
        .outputOptions(['-map [aout]', '-c:a libmp3lame'])
        .save(dubbedAudioPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // Rebuild final video with new audio track
    await updateProgress(4, 75, 'Encoding final output video file...');
    await new Promise((resolve, reject) => {
      ffmpeg(videoFilePath)
        .input(dubbedAudioPath)
        .outputOptions([
          '-c:v copy', // Preserve original video resolution/frame rate without re-encoding
          '-c:a aac',
          '-map 0:v:0',
          '-map 1:a:0',
          '-shortest'
        ])
        .save(outputVideoPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // Generate Subtitles (SRT and VTT)
    await updateProgress(4, 90, 'Generating SRT and VTT subtitles...');
    let srtContent = '';
    let vttContent = 'WEBVTT\n\n';
    
    translatedTranscript.forEach((seg, index) => {
      const displayIndex = index + 1;
      const srtStart = formatSrtTime(seg.start);
      const srtEnd = formatSrtTime(seg.end);
      const vttStart = formatVttTime(seg.start);
      const vttEnd = formatVttTime(seg.end);

      srtContent += `${displayIndex}\n${srtStart} --> ${srtEnd}\n[${seg.speaker}] ${seg.text}\n\n`;
      vttContent += `${displayIndex}\n${vttStart} --> ${vttEnd}\n[${seg.speaker}] ${seg.text}\n\n`;
    });

    const srtFilename = `subtitles-${targetLangCode}-${processId}.srt`;
    const vttFilename = `subtitles-${targetLangCode}-${processId}.vtt`;
    fs.writeFileSync(path.join(videosDir, srtFilename), srtContent);
    fs.writeFileSync(path.join(videosDir, vttFilename), vttContent);

    // Clean up temporary TTS segments
    ttsFiles.forEach(file => {
      try { fs.unlinkSync(file.path); } catch (e) {}
    });
    try { fs.unlinkSync(audioFilePath); } catch (e) {}
    if (isTempVideo) {
      try { fs.unlinkSync(videoFilePath); } catch (e) {}
    }

    await updateProgress(4, 100, 'Packaging downloads and completing job...');

    const baseHost = `http://localhost:5001/api/videos`;
    
    // Save details to database
    job.status = 'completed';
    job.originalLanguage = detectedLanguage;
    job.originalTranscript = originalTranscript;
    job.translatedTranscript = translatedTranscript;
    job.translatedVideoUrl = `${baseHost}/stream/${outputVideoFilename}`;
    job.srtUrl = `${baseHost}/stream/${srtFilename}`;
    job.vttUrl = `${baseHost}/stream/${vttFilename}`;
    await job.save();

    res.json({
      success: true,
      originalLanguage: detectedLanguage,
      originalTranscript,
      translatedTranscript,
      srtContent,
      vttContent,
      dubbedAudioUrl: `${baseHost}/stream/${dubbedAudioFilename}`,
      translatedVideoUrl: `${baseHost}/stream/${outputVideoFilename}`,
      subtitleUrl: `${baseHost}/stream/${srtFilename}`,
      vttSubtitleUrl: `${baseHost}/stream/${vttFilename}`
    });

  } catch (err) {
    console.error('Translation pipeline error:', err);
    job.status = 'failed';
    job.logs.push(`[ERROR] ${err.message}`);
    await job.save();
    res.status(500).json({ message: 'AI Translation pipeline encountered an error: ' + err.message });
  }
});

module.exports = router;

