const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI("85252ff41cea4a8c9b5ef047d7393413.JqyRy5pW-Bxil2rTsN8R8WPv");
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent("hello");
    console.log("Gemini:", result.response.text());
  } catch(e) {
    console.log("FAIL:", e.message);
  }
}
run();
