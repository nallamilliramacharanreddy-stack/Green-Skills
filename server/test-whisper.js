const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

async function test() {
  const { pipeline } = await import('@xenova/transformers');
  const { WaveFile } = require('wavefile');

  const videoPath = path.resolve(__dirname, './uploads/videos/BWqjPHGM5D0.mp4'); // Need a dummy video with audio
  const wavPath = path.resolve(__dirname, './uploads/videos/test-audio.wav');

  // Extract first 15 seconds of audio to WAV
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .duration(15) // Only first 15 sec for speed
      .save(wavPath)
      .on('end', resolve)
      .on('error', reject);
  });

  console.log("Audio extracted. Loading Whisper model...");
  const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
  
  console.log("Reading wave file...");
  let wav = new WaveFile(fs.readFileSync(wavPath));
  wav.toBitDepth('32f');
  wav.toSampleRate(16000);
  let audioData = wav.getSamples();
  if (Array.isArray(audioData)) {
    audioData = audioData[0]; // Get first channel
  }

  console.log("Running transcription...");
  const result = await transcriber(audioData, { return_timestamps: true });
  console.log("Transcription result:", JSON.stringify(result, null, 2));
}

test().catch(console.error);
