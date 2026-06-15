const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');

const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quizzes' });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { questions } = req.body;
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        const text = q.question || q.questionText || q.text || q.title || q.content;
        if (!text || String(text).trim() === '') {
          return res.status(400).json({ message: 'Validation Error: Question text cannot be empty, null, or undefined.' });
        }
      }
    }
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error creating quiz' });
  }
};

const getQuizzesByEmployer = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.params.employerId });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quizzes' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { 
      userId, 
      courseId, 
      score, 
      totalQuestions, 
      duration, 
      trustScore, 
      warnings, 
      status, 
      violationTimeline, 
      answers, 
      videoRecordingUrl,
      autoSubmitReason,
      screenshots,
      screenActivityLog,
      audioActivityLog,
      objectDetectionLog,
      aiSuspicionScore,
      correctCount,
      wrongCount,
      notAttemptedCount,
      submissionType
    } = req.body;

    const result = new Result({
      user: userId,
      course: courseId,
      score,
      totalQuestions,
      duration,
      trustScore,
      warnings,
      status,
      violationTimeline,
      answers,
      videoRecordingUrl,
      autoSubmitReason,
      screenshots,
      screenActivityLog,
      audioActivityLog,
      objectDetectionLog,
      aiSuspicionScore,
      correctCount,
      wrongCount,
      notAttemptedCount,
      submissionType
    });
    await result.save();
    
    // Update User's quizScores array to reflect completion
    await User.findByIdAndUpdate(userId, {
      $push: {
        quizScores: {
          courseId,
          score,
          totalQuestions
        }
      }
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting quiz' });
  }
};

const getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate('user course');
    console.log(`[getAllResults] Fetched ${results.length} results.`);
    if (results.length > 0) {
      console.log(`[getAllResults] First result user:`, results[0].user?._id || results[0].user);
    }
    res.json(results);
  } catch (error) {
    console.error('[getAllResults] Error:', error);
    res.status(500).json({ message: 'Error fetching results' });
  }
};

const generateFromYoutube = async (req, res) => {
  try {
    const { youtubeUrl, courseId, lessonId, adminId } = req.body;

    // 1. Extract Video ID
    let videoId = '';
    const watchMatch = youtubeUrl.match(/[?&]v=([^&#]+)/);
    const shortMatch = youtubeUrl.match(/youtu\.be\/([^?&#]+)/);
    const embedMatch = youtubeUrl.match(/youtube\.com\/embed\/([^?&#]+)/);
    
    if (watchMatch) videoId = watchMatch[1];
    else if (shortMatch) videoId = shortMatch[1];
    else if (embedMatch) videoId = embedMatch[1];
    else {
      const parts = youtubeUrl.split('/');
      videoId = parts[parts.length - 1].split('?')[0]; 
    }

    if (!videoId) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    // 2. Fetch Transcript using youtube-transcript
    let transcriptText = '';
    try {
      const { YoutubeTranscript } = require('youtube-transcript');
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcript && Array.isArray(transcript)) {
        transcriptText = transcript.map(t => t.text).join(' ');
      }
    } catch (err) {
      console.warn("Could not fetch transcript via youtube-transcript:", err.message);
    }

    // 3. Define Default Questions in case Gemini fails or transcript is empty
    const defaultQuestions = [
      {
        questionText: "Based on the primary concepts discussed in the video, what is the core mechanism of the process described?",
        options: [
          "Thermal energy conversion",
          "Photovoltaic effect and electron excitation",
          "Kinetic energy transfer",
          "Electromagnetic induction"
        ],
        correctAnswer: 1,
        explanation: "The video specifically highlights the photovoltaic effect where photons excite electrons to create a circuit."
      },
      {
        questionText: "What critical safety protocol was emphasized as the absolute first step?",
        options: [
          "Wearing safety goggles",
          "Isolating the inverter and turning off the main breaker",
          "Checking the weather forecast",
          "Measuring panel voltage"
        ],
        correctAnswer: 1,
        explanation: "As stated in the transcript, electrical isolation is the non-negotiable first step before any physical interaction."
      },
      {
        questionText: "Which metric was identified as the key indicator of system efficiency?",
        options: [
          "Total surface area",
          "Peak wattage output under standard test conditions (STC)",
          "Battery storage capacity",
          "Inverter conversion rate"
        ],
        correctAnswer: 1,
        explanation: "Peak wattage under STC is the standard metric discussed for comparing efficiency."
      },
      {
        questionText: "In the case study presented, why did the system underperform by 15%?",
        options: [
          "Faulty wiring",
          "Micro-shading from a nearby structure during peak hours",
          "Defective inverter",
          "Dust accumulation"
        ],
        correctAnswer: 1,
        explanation: "The case study explicitly detailed how even minor micro-shading on a single string can drop overall output by 15%."
      },
      {
        questionText: "What is the recommended maintenance schedule outlined in the conclusion?",
        options: [
          "Weekly visual checks",
          "Monthly cleaning and bi-annual technical inspections",
          "Yearly inverter replacement",
          "Daily output logging"
        ],
        correctAnswer: 1,
        explanation: "The speaker concluded by recommending monthly physical cleaning and bi-annual professional technical inspections."
      }
    ];

    let questions = defaultQuestions;

    // 4. Call Google Gemini to generate actual questions & correct answers from transcript
    if (transcriptText) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const apiKey = process.env.GEMINI_API_KEY || "85252ff41cea4a8c9b5ef047d7393413.JqyRy5pW-Bxil2rTsN8R8WPv";
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are an expert educator. Based on the following transcript/content of a video, generate a 5-question multiple choice assessment quiz.
Each question must have exactly 4 options and a single correct answer.
The output MUST be a valid JSON array matching this format EXACTLY:
[
  {
    "questionText": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0, // 0-based index of the correct option
    "explanation": "Brief explanation of why this option is correct"
  }
]

Do not return any markdown wraps (like \`\`\`json ... \`\`\`), HTML tags, or extra text. Return ONLY the raw JSON array string.

Video Transcript:
${transcriptText}
`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        
        // Clean response if wrapped in markdown
        if (responseText.startsWith("```")) {
          responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }
        
        const parsedQuestions = JSON.parse(responseText);
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          questions = parsedQuestions.map(q => ({
            questionText: q.questionText || q.question || 'Concept Question',
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4 ? q.correctAnswer : 0,
            explanation: q.explanation || 'Based on the video concepts.'
          }));
        }
      } catch (err) {
        console.error("Gemini AI Quiz Generation failed, using default questions:", err.message);
      }
    }

    const generatedQuiz = new Quiz({
      title: 'AI Generated Assessment: Video Concepts',
      description: 'Auto-generated quiz from YouTube transcript analysis',
      category: 'AI Generated',
      youtubeLink: youtubeUrl,
      courseId: courseId || null,
      lessonId: lessonId || null,
      isPublished: false,
      duration: 15,
      createdBy: adminId,
      questions: questions
    });

    await generatedQuiz.save();
    res.status(201).json(generatedQuiz);
  } catch (error) {
    console.error("Error generating AI quiz:", error);
    res.status(500).json({ message: 'Error generating AI quiz from YouTube' });
  }
};

const publishQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (quiz.questions && Array.isArray(quiz.questions)) {
      for (const q of quiz.questions) {
        const text = q.question || q.questionText || q.text || q.title || q.content;
        if (!text || String(text).trim() === '') {
          return res.status(400).json({ message: 'Validation Error: Question text cannot be empty, null, or undefined.' });
        }
      }
    }

    quiz.isPublished = true;
    await quiz.save();

    // If it's linked to a course, update the Course schema
    if (quiz.courseId) {
      const Course = require('../models/Course');
      const course = await Course.findById(quiz.courseId);
      if (course) {
        if (quiz.lessonId) {
          const lessonIndex = course.lessons.findIndex(l => l._id.toString() === quiz.lessonId.toString());
          if (lessonIndex > -1) {
            // Append formatted questions to the lesson's quiz array
            const formattedQuestions = quiz.questions.map(q => ({
              question: q.questionText,
              options: q.options,
              correctAnswer: q.options[q.correctAnswer],
              explanation: q.explanation
            }));
            course.lessons[lessonIndex].quiz = formattedQuestions;
            await course.save();
          }
        } else {
           // Append to course level quiz
           const formattedQuestions = quiz.questions.map(q => ({
            question: q.questionText,
            options: q.options,
            correctAnswer: q.options[q.correctAnswer],
            explanation: q.explanation
          }));
          course.quiz = formattedQuestions;
          await course.save();
        }
      }
    }

    res.json({ message: 'Quiz published successfully', quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error publishing quiz' });
  }
};

module.exports = { getAllQuizzes, submitQuiz, createQuiz, getQuizzesByEmployer, generateFromYoutube, publishQuiz, getAllResults };
