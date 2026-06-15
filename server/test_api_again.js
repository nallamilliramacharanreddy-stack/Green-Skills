async function run() {
  try {
    const targetId = '6a113b8eb791a973b05c7d8f';
    const res = await fetch(`http://localhost:5001/api/quizzes/results?userId=${targetId}`);
    const data = await res.json();
    console.log(`Fetched ${data.length} results from API for user ${targetId}`);
    
    // Check if it works without query param too
    const res2 = await fetch(`http://localhost:5001/api/quizzes/results`);
    const data2 = await res2.json();
    console.log(`Fetched ${data2.length} total results from API without query param`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
