const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const ttsAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=te&client=tw-ob&q=Test`;

let filterComplex = '';
let inputs = [];

let command = ffmpeg().input('color=c=black:s=1280x720:r=30').inputFormat('lavfi').inputOptions(['-t', '5']);

for(let i=0; i<3; i++) {
  command = command.input(ttsAudioUrl);
  const delayMs = i * 2000;
  filterComplex += `[${i + 1}:a]adelay=${delayMs}|${delayMs}[a${i}];`;
  inputs.push(`[a${i}]`);
}
filterComplex += `${inputs.join('')}amix=inputs=${inputs.length}:duration=longest[aout]`;

console.log("Filter:", filterComplex);

command
  .complexFilter(filterComplex)
  .outputOptions([
    '-c:v libx264',
    '-c:a aac',
    '-map 0:v:0',
    '-map [aout]'
  ])
  .on('start', (cmd) => console.log('CMD:', cmd))
  .on('error', (err) => console.error('ERR:', err.message))
  .on('end', () => console.log('DONE'))
  .save('./output-test.mp4');
