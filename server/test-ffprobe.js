const ffmpeg = require('fluent-ffmpeg');
const ffprobePath = require('ffprobe-static').path;
ffmpeg.setFfprobePath(ffprobePath);

ffmpeg.ffprobe('http://localhost:5001/api/videos/stream/direct-123.mp4', (err, metadata) => {
  if (err) console.error(err);
  else console.log("Duration:", metadata.format.duration);
});
