const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('http://localhost:5001/api/quizzes/results');
    console.log(`Fetched ${res.data.length} total results from API`);
    
    // We want to test against the known user ID: '6a113b8eb791a973b05c7d8f'
    // Let's print out all the user IDs in the results
    const uniqueUserIds = new Set();
    res.data.forEach(r => {
      const resultUserId = (r.user?._id || r.user)?.toString();
      if (resultUserId) uniqueUserIds.add(resultUserId);
    });
    
    console.log("Unique User IDs in database results:", Array.from(uniqueUserIds));
    
    const targetId = '6a113b8eb791a973b05c7d8f'; // the ID we found earlier for bandibswaroopa
    const filtered = res.data.filter(r => {
      const resultUserId = (r.user?._id || r.user)?.toString();
      return resultUserId === targetId;
    });
    console.log(`Found ${filtered.length} results matching ${targetId}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
