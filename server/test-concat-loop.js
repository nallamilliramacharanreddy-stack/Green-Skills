const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

// Create dummy audio
const { execSync } = require('child_process');
execSync(`"${ffmpegPath}" -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -y dummy.mp3`);

// Create concat file
fs.writeFileSync('concat.txt', "file '" + process.cwd() + "/dummy.mp3'\n");

// Test ffmpeg loop
ffmpeg()
  .input('concat.txt')
  .inputOptions(['-f', 'concat', '-safe', '0', '-stream_loop', '-1'])
  .input('color=c=black:s=128x72:r=30')
  .inputFormat('lavfi')
  .inputOptions(['-t', '3'])
  .outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-map', '1:v:0', '-map', '0:a:0', '-shortest'])
  .on('start', console.log)
  .on('end', () => console.log('SUCCESS'))
  .on('error', (err) => console.log('ERROR', err.message))
  .save('test-loop-output.mp4');
