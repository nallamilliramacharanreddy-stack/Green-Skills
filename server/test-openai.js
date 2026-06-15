async function run() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer 85252ff41cea4a8c9b5ef047d7393413.JqyRy5pW-Bxil2rTsN8R8WPv` }
    });
    console.log("OpenAI:", await response.json());
  } catch(e) {}
}
run();
