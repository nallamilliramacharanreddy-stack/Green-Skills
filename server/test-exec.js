const { exec } = require('child_process');
exec(`/Users/nallamilliramacharanreddygmail.com/Downloads/INHOUSE\\ PROJECT\\ 6/server/node_modules/youtube-dl-exec/bin/yt-dlp -g "https://www.youtube.com/watch?v=WtZgsyhA294" --format "best[ext=mp4]" --no-check-certificates --force-ipv4`, (err, stdout, stderr) => {
    console.log("ERR:", err);
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);
});
