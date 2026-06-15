const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const videosDir = path.resolve(__dirname, './uploads/videos');

async function run() {
  const targetCode = 'te';
  const selectedPhrases = ['Test 1'];
  const videoUrl = 'http://127.0.0.1:5001/api/videos/stream/direct-123.mp4';
  
  const outputFileName = `translated-${targetCode}-${Date.now()}.mp4`;
  const outputPath = path.join(videosDir, outputFileName);
  const concatFileName = `concat-${Date.now()}.txt`;
  const concatFilePath = path.join(videosDir, concatFileName);

  let concatContent = '';
  
  for (let i = 0; i < selectedPhrases.length; i++) {
    const text = selectedPhrases[i];
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetCode}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const audioRes = await fetch(url);
    const buffer = await audioRes.arrayBuffer();
    const audioFileName = `tts-${targetCode}-${Date.now()}-${i}.mp3`;
    const audioFilePath = path.join(videosDir, audioFileName);
    fs.writeFileSync(audioFilePath, Buffer.from(buffer));
    
    // THE FIX: absolute path
    concatContent += `file '${audioFilePath}'\n`;
  }
  
  fs.writeFileSync(concatFilePath, concatContent);

  console.log("Running ffmpeg...");
  ffmpeg()
    .input(concatFilePath)
    .inputOptions(['-f', 'concat', '-safe', '0', '-stream_loop', '-1'])
    // Instead of streaming videoUrl (which is offline), use a generated dummy video for testing FFmpeg logic
    .input('color=c=black:s=1280x720:r=30')
    .inputFormat('lavfi')
    .inputOptions(['-t', '5']) // 5 seconds dummy video
    .outputOptions([
      '-c:v libx264',
      '-c:a aac',
      '-map 1:v:0',
      '-map 0:a:0',
      '-shortest'
    ])
    .save(outputPath)
    .on('end', () => console.log('SUCCESS'))
    .on('error', (err) => console.error('FFmpeg processing error:', err.message));
}

run().catch(console.error);
