const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function run() {
  try {
    const prompt = "Generate a 1-question multiple choice quiz about the sun in JSON array format with options, correctAnswer (index), and explanation.";
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
  } catch(e) {
    console.log("ERROR STATUS:", e.status || e.response?.status);
    console.log("ERROR MESSAGE:", e.message);
  }
}
run();
