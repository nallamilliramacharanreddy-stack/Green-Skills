const fs = require('fs');
async function test() {
  const text = "విద్యార్థులు కోర్సు సోల్ ఎనర్జీ ఇంజనీరింగ్ మరియు టెక్నాలజీ యొక్క మొదటి ఉపన్యాసాన్ని స్వాగతించారు. కాబట్టి, ఈ రోజు మనం ఎనర్జీ దృష్టాంతం గురించి చర్చిస్తాము.";
  console.log("Text length:", text.length);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=te&client=tw-ob&q=${encodeURIComponent(text)}`;
  console.log(url);
  const audioRes = await fetch(url);
  console.log("Status:", audioRes.status);
  const buffer = await audioRes.arrayBuffer();
  console.log("Buffer size:", buffer.byteLength);
}
test();
