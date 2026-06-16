const fetch = global.fetch || require('node-fetch');

async function testRegen() {
  console.log("=== TESTING SINGLE QUESTION REGENERATION ENDPOINT ===");
  const url = 'http://localhost:5001/api/courses/regenerate-question';
  
  const payload = {
    transcript: "Welcome to the introduction to solar energy systems. Solar panels capture sunlight using photovoltaic cells. These cells convert light into direct current (DC) electricity.",
    existingQuestions: [
      "What converts sunlight into direct current (DC) electricity in solar panels?"
    ],
    difficulty: "Medium",
    language: "English"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log("Response Status:", response.status);
    const data = await response.json();
    console.log("Response Data:");
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testRegen();
