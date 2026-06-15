const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    if(data.error) console.log("ERROR:", data.error.message);
    else console.log("SUCCESS:", data.models.length, "models found");
  } catch(e) {
    console.log("FAIL:", e.message);
  }
}
run();
