const { exec } = require('child_process');
const path = require('path');
const ytDlpPath = path.resolve(__dirname, './node_modules/youtube-dl-exec/bin/yt-dlp');

exec(`"${ytDlpPath}" -g "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --format "best[ext=mp4]"`, (error, stdout, stderr) => {
  if (error) console.error("Error:", error.message);
  else console.log("Stream URL:", stdout.trim().substring(0, 50) + "...");
});
