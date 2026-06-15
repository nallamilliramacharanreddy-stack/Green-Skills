async function test() {
  try {
    console.log("Calling API...");
    const res = await globalThis.fetch('http://127.0.0.1:5001/api/videos/translate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: 'http://127.0.0.1:5001/api/videos/stream/direct-123.mp4',
        targetLanguage: 'Telugu'
      })
    });
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}
test();
