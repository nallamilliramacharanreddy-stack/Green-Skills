const text = "విద్యార్థులు కోర్సు సోల్ ఎనర్జీ ఇంజనీరింగ్ మరియు టెక్నాలజీ యొక్క మొదటి ఉపన్యాసాన్ని స్వాగతించారు. కాబట్టి, ఈ రోజు మనం ఎనర్జీ దృష్టాంతం గురించి చర్చిస్తాము.";

function splitText(str, maxLength) {
  const words = str.split(' ');
  const chunks = [];
  let currentChunk = '';
  
  for (const word of words) {
    if (currentChunk.length + word.length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = word + ' ';
    } else {
      currentChunk += word + ' ';
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

console.log(splitText(text, 30));
