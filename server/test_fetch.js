async function run() {
  try {
    const res = await fetch('http://localhost:5001/api/quizzes/results');
    const data = await res.json();
    console.log(`Fetched ${data.length} total results from API`);
    
    const uniqueUserIds = new Set();
    data.forEach(r => {
      const resultUserId = (r.user?._id || r.user)?.toString();
      if (resultUserId) uniqueUserIds.add(resultUserId);
    });
    
    console.log("Unique User IDs in database results:", Array.from(uniqueUserIds));
    
    const targetId = '6a113b8eb791a973b05c7d8f';
    const filtered = data.filter(r => {
      const resultUserId = (r.user?._id || r.user)?.toString();
      return resultUserId === targetId;
    });
    console.log(`Found ${filtered.length} results matching ${targetId}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
