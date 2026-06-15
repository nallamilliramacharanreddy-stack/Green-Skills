async function run() {
  try {
    const targetId = '6a113bd9a94a11fdadb97a3e'; // Rama
    const payload = {
      userId: targetId,
      courseId: '6a2c4cc20c73dc0ffa4b4c51',
      score: 10,
      totalQuestions: 10,
      duration: 120,
      trustScore: 90,
      warnings: 0,
      status: 'Pass',
      violationTimeline: [],
      answers: [],
      videoRecordingUrl: '',
      autoSubmitReason: '',
      screenshots: [],
      screenActivityLog: [],
      audioActivityLog: [],
      objectDetectionLog: [],
      aiSuspicionScore: 10,
      correctCount: 10,
      wrongCount: 0,
      notAttemptedCount: 0,
      submissionType: 'Normal Submission'
    };
    
    const res = await fetch(`http://localhost:5001/api/quizzes/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("Submit Response:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
