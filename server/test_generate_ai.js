// Node 18+ has global fetch

async function testGenerate() {
  console.log("=== TESTING AI GENERATION ENDPOINT ===");
  const url = 'http://localhost:5001/api/courses/generate-ai-assessment';
  
  const payload = {
    transcript: "Welcome to the introduction to solar energy systems. Solar panels capture sunlight using photovoltaic cells. These cells convert light into direct current (DC) electricity. An inverter then converts the DC electricity into alternating current (AC) electricity, which is used to power home appliances. Solar systems are clean, renewable, and reduce carbon emissions. Bi-annual technical inspection is recommended to keep panels operating at peak performance.",
    numQuestions: 5,
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

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(decoder.decode(value));
    }
    console.log("=== STREAM ENDED ===");

  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testGenerate();
