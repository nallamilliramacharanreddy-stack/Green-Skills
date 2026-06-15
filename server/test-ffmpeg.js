const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

console.log("Starting test...");
ffmpeg()
  .input('http://localhost:5001/api/videos/stream/direct-123.mp4') // Fake URL, just to see if ffmpeg throws an error fast
  .on('start', (cmd) => console.log('Started:', cmd))
  .on('error', (err) => console.error('Error:', err.message))
  .on('end', () => console.log('Finished!'))
  .outputOptions(['-t 5'])
  .save('./test-output.mp4');
