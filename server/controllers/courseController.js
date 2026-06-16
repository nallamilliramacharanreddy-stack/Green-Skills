const Course = require('../models/Course');
const User = require('../models/User');
const { processVideo } = require('../utils/videoProcessor');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

const getUserFromRequest = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return jwt.verify(token, JWT_SECRET);
    }
    if (req.cookies && req.cookies.token) {
      return jwt.verify(req.cookies.token, JWT_SECRET);
    }
  } catch (err) {
    // Ignore invalid/expired tokens
  }
  return null;
};

const stripQuizAnswers = (course, isAdminOrEmployer) => {
  if (isAdminOrEmployer) return course;
  
  const doc = course.toObject ? course.toObject() : JSON.parse(JSON.stringify(course));
  
  if (doc.quiz && Array.isArray(doc.quiz)) {
    doc.quiz = doc.quiz.map(q => {
      const { correctAnswer, explanation, ...rest } = q;
      return rest;
    });
  }
  
  if (doc.lessons && Array.isArray(doc.lessons)) {
    doc.lessons = doc.lessons.map(lesson => {
      if (lesson.quiz && Array.isArray(lesson.quiz)) {
        lesson.quiz = lesson.quiz.map(q => {
          const { correctAnswer, explanation, ...rest } = q;
          return rest;
        });
      }
      return lesson;
    });
  }
  
  return doc;
};

const triggerVideoProcessing = (course) => {
  if (course && course.lessons && course.lessons.length > 0) {
    course.lessons.forEach(lesson => {
      if (lesson.youtubeLink && !lesson.internalVideoUrl && lesson.status !== 'processing') {
        // Trigger async background processing
        processVideo(course._id, lesson._id, lesson.youtubeLink);
      }
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    const user = getUserFromRequest(req);
    const isAdminOrEmployer = user && ['admin', 'employer', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin'].includes(user.role);
    
    const sanitizedCourses = courses.map(c => stripQuizAnswers(c, isAdminOrEmployer));
    res.json(sanitizedCourses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    const user = getUserFromRequest(req);
    const isAdminOrEmployer = user && ['admin', 'employer', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin'].includes(user.role);
    
    res.json(stripQuizAnswers(course, isAdminOrEmployer));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course' });
  }
};

const createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();

    // Trigger background processing for YouTube links
    triggerVideoProcessing(course);

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating course' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    Object.assign(course, req.body);
    await course.save();

    // Trigger background processing for YouTube links
    triggerVideoProcessing(course);

    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating course' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course' });
  }
};

const generateQuizFromYoutube = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let youtubeUrl = '';
    if (course.lessons && course.lessons.length > 0) {
      const lessonWithYoutube = course.lessons.find(l => l.youtubeLink);
      if (lessonWithYoutube) {
        youtubeUrl = lessonWithYoutube.youtubeLink;
      }
    }

    if (!youtubeUrl) {
      youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    }

    // Extract Video ID
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

    let transcriptText = '';
    try {
      const { YoutubeTranscript } = require('youtube-transcript');
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcript && Array.isArray(transcript)) {
        transcriptText = transcript.map(t => t.text).join(' ');
      }
    } catch (err) {
      console.warn("Could not fetch transcript via youtube-transcript in course generateQuiz:", err.message);
    }

    let questions = [];
    if (transcriptText && process.env.GEMINI_API_KEY) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Based on the following video transcript, generate a 20-question multiple-choice assessment quiz.
Each question must have exactly 4 unique options (no blank options, no duplicate options, no nearly-identical options).
The output MUST be a valid JSON array matching this format EXACTLY:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation"
  }
]
No markdown, just raw JSON.

Transcript:
${transcriptText.substring(0, 10000)}
`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        if (responseText.startsWith("```")) {
          responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }
        
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) {
          questions = parsed.map(q => ({
            question: q.question || q.questionText || 'Concept Question',
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'Option A'),
            explanation: q.explanation || 'Based on the video concepts.',
            questionType: 'single'
          }));
        }
      } catch (err) {
        console.error("Gemini course quiz generation failed:", err.message);
      }
    }

    if (questions.length === 0) {
      for (let i = 1; i <= 20; i++) {
        questions.push({
          question: `Concept Question ${i}: What is the core topic of ${course.title}?`,
          options: [`Topic Definition ${i}`, `Alternative Concept ${i}`, `Unrelated Theory ${i}`, `Practical Detail ${i}`],
          correctAnswer: `Topic Definition ${i}`,
          explanation: `This option correctly defines the core topic for lesson ${i}.`,
          questionType: 'single'
        });
      }
    }

    if (!course.lessons || course.lessons.length === 0) {
      const mockLessons = [];
      for (let i = 1; i <= 20; i++) {
        mockLessons.push({
          title: `Lesson ${i}: Master Class`,
          videoSource: 'youtube',
          youtubeLink: youtubeUrl,
          duration: '10:00'
        });
      }
      course.lessons = mockLessons;
    }

    if (!course.tasks || course.tasks.length === 0) {
      const mockTasks = [];
      for (let i = 1; i <= 5; i++) {
        mockTasks.push({
          title: `Task ${i}: Industrial Assignment`,
          description: `Practical task related to lesson ${i * 4}`,
          type: 'Practical'
        });
      }
      course.tasks = mockTasks;
    }

    course.quiz = questions;
    await course.save();
    res.json({ message: 'Course assessment nodes generated successfully', course });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error generating course content' });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const course = await Course.findById(id);
    const user = await User.findById(userId);

    if (!course || !user) {
      return res.status(404).json({ message: 'Course or User not found' });
    }

    if (!course.enrolledStudents) {
      course.enrolledStudents = [];
    }
    if (!course.enrolledStudents.some(sId => sId && sId.toString() === userId)) {
      course.enrolledStudents.push(userId);
      await course.save();
    }

    // Deep initialize progress to avoid nested undefined errors
    if (!user.progress) {
      user.progress = { completedCourses: [], currentCourses: [], courseProgress: [] };
    } else {
      if (!user.progress.completedCourses) user.progress.completedCourses = [];
      if (!user.progress.currentCourses) user.progress.currentCourses = [];
      if (!user.progress.courseProgress) user.progress.courseProgress = [];
    }

    if (!user.progress.currentCourses.some(cId => cId && cId.toString() === id) && !user.progress.completedCourses.some(cId => cId && cId.toString() === id)) {
      user.progress.currentCourses.push(id);

      // Initialize granular progress
      if (!user.progress.courseProgress.find(p => p && p.courseId && p.courseId.toString() === id)) {
        user.progress.courseProgress.push({
          courseId: id,
          completedLessons: [],
          completedTasks: []
        });
      }

      user.markModified('progress');
      await user.save();
    }

    const populatedUser = await User.findById(userId)
      .populate('progress.currentCourses')
      .populate('progress.completedCourses');

    res.json({ message: 'Successfully enrolled in course', course, user: populatedUser });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Error enrolling in course' });
  }
};

const unenrollInCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const course = await Course.findById(id);
    const user = await User.findById(userId);

    if (!course || !user) {
      return res.status(404).json({ message: 'Course or User not found' });
    }

    if (course.enrolledStudents) {
      course.enrolledStudents = course.enrolledStudents.filter(sId => sId && sId.toString() !== userId);
      await course.save();
    }

    if (user.progress && user.progress.currentCourses) {
      user.progress.currentCourses = user.progress.currentCourses.filter(cId => cId && cId.toString() !== id);
      user.markModified('progress');
      await user.save();
    }

    const populatedUser = await User.findById(userId)
      .populate('progress.currentCourses')
      .populate('progress.completedCourses');

    res.json({ message: 'Successfully unenrolled from course', course, user: populatedUser });
  } catch (error) {
    console.error('Unenrollment error:', error);
    res.status(500).json({ message: 'Error unenrolling from course' });
  }
};
const completeCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.progress) {
      user.progress = { completedCourses: [], currentCourses: [] };
    }

    // Remove from current - Commented out to keep enrolled courses permanently
    // user.progress.currentCourses = (user.progress.currentCourses || []).filter(cId => cId.toString() !== id);

    // Add to completed if not already there
    if (!(user.progress.completedCourses || []).some(cId => cId.toString() === id)) {
      user.progress.completedCourses.push(id);
    }

    user.markModified('progress');
    await user.save();

    const populatedUser = await User.findById(userId)
      .populate('progress.currentCourses')
      .populate('progress.completedCourses');

    res.json({ message: 'Course marked as complete', user: populatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error completing course' });
  }
};

const completeLesson = async (req, res) => {
  try {
    const { id } = req.params; // courseId
    const { userId, lessonIndex } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let prog = user.progress.courseProgress.find(p => p.courseId.toString() === id);
    if (!prog) {
      prog = { courseId: id, completedLessons: [], completedTasks: [] };
      user.progress.courseProgress.push(prog);
    }

    if (!prog.completedLessons.includes(lessonIndex)) {
      prog.completedLessons.push(lessonIndex);
    }

    user.markModified('progress');
    await user.save();

    const populatedUser = await User.findById(userId)
      .populate('progress.currentCourses')
      .populate('progress.completedCourses');

    res.json({ message: 'Lesson completed', user: populatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error completing lesson' });
  }
};

const completeTask = async (req, res) => {
  try {
    const { id } = req.params; // courseId
    const { userId, taskIndex } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let prog = user.progress.courseProgress.find(p => p.courseId.toString() === id);
    if (!prog) {
      prog = { courseId: id, completedLessons: [], completedTasks: [] };
      user.progress.courseProgress.push(prog);
    }

    if (!prog.completedTasks.includes(taskIndex)) {
      prog.completedTasks.push(taskIndex);
    }

    user.markModified('progress');
    await user.save();

    const populatedUser = await User.findById(userId)
      .populate('progress.currentCourses')
      .populate('progress.completedCourses');

    res.json({ message: 'Task completed', user: populatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error completing task' });
  }
};

const generateAIAssessment = async (req, res) => {
  // Set up Server-Sent Events (SSE) headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevent buffering on Render/Nginx reverse proxy
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { transcript, numQuestions, difficulty, language } = req.body;

    if (!transcript || transcript.trim() === '') {
      sendEvent({ error: 'Transcript content is missing or empty. Please provide transcript content before generating assessment.' });
      return res.end();
    }

    if (!process.env.GEMINI_API_KEY) {
      sendEvent({ error: 'GEMINI_API_KEY is not configured in the server environment.' });
      return res.end();
    }

    sendEvent({ progress: 'Analyzing Transcript...' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const totalQuestions = parseInt(numQuestions) || 50;
    
    // Smart chunking based on transcript size and question count (reducing number of chunks)
    let questionsPerChunk = 10;
    if (transcript.length < 12000 || totalQuestions <= 15) {
      questionsPerChunk = totalQuestions; // 1 single chunk!
    } else if (totalQuestions <= 30) {
      questionsPerChunk = 15; // 2 chunks
    } else {
      questionsPerChunk = 20; // 2 or 3 chunks
    }

    const chunkCount = Math.ceil(totalQuestions / questionsPerChunk);
    const transcriptLength = transcript.length;
    const charsPerChunk = Math.ceil(transcriptLength / chunkCount);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const generateChunkWithRetry = async (chunkText, chunkQuestionsCount) => {
      const prompt = `Analyze the following educational transcript chunk and generate exactly ${chunkQuestionsCount} multiple-choice questions at a ${difficulty || 'Medium'} difficulty level in ${language || 'English'}.
      
      CRITICAL RULES:
      1. NEVER generate ANY placeholder text, dummy questions, or generic text.
      2. DO NOT use phrases like "Sample Question", "Placeholder Question", "Generic Question", "Based on the Transcript", "Option A Placeholder", "Conceptual Placeholder", or "Factual Placeholder".
      3. Generate EXACTLY the requested number of questions (${chunkQuestionsCount}).
      4. ALL questions MUST be derived entirely from the provided transcript content.
      5. Include a variety of question types: Conceptual, Numerical, Scenario, Application, and Fact-Based.
      6. Provide 4 unique, meaningful options per question. No generic options.
      7. Identify the actual correct answer from the transcript content and store its exact text value in "correctAnswer".
      8. Provide a detailed, highly specific explanation based on the transcript to justify the answer.
      9. Return the result strictly as a JSON array of objects.

      Expected JSON format:
      [
        {
          "question": "Actual question text extracted from transcript logic",
          "options": ["Meaningful Option A", "Meaningful Option B", "Meaningful Option C", "Meaningful Option D"],
          "correctAnswer": "Meaningful Option A",
          "explanation": "Actual explanation based on transcript content.",
          "difficulty": "Easy/Medium/Hard",
          "marks": 1
        }
      ]

      Transcript chunk:
      ${chunkText}
      `;

      let attempt = 1;
      const maxAttempts = 3;
      const retryDelays = [4000, 8000, 15000]; // 4s, 8s, 15s

      while (attempt <= maxAttempts) {
        try {
          const result = await model.generateContent(prompt);
          let responseText = result.response.text().trim();
          
          if (responseText.startsWith("```")) {
            responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
          } else {
            const jsonStart = responseText.indexOf('[');
            const jsonStartObj = responseText.indexOf('{');
            let startIdx = -1;
            if (jsonStart !== -1 && jsonStartObj !== -1) {
              startIdx = Math.min(jsonStart, jsonStartObj);
            } else {
              startIdx = jsonStart !== -1 ? jsonStart : jsonStartObj;
            }
            if (startIdx !== -1) {
              const jsonEnd = Math.max(responseText.lastIndexOf(']'), responseText.lastIndexOf('}'));
              if (jsonEnd !== -1 && jsonEnd > startIdx) {
                responseText = responseText.substring(startIdx, jsonEnd + 1);
              }
            }
          }
          
          let parsed = JSON.parse(responseText);
          let questionsArray = [];
          
          if (Array.isArray(parsed)) {
            questionsArray = parsed;
          } else if (parsed && typeof parsed === 'object') {
            const keys = ['questions', 'quiz', 'assessment', 'questionsList', 'items', 'list'];
            for (const key of keys) {
              if (Array.isArray(parsed[key])) {
                questionsArray = parsed[key];
                break;
              }
            }
            if (questionsArray.length === 0) {
              const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
              if (possibleArray) {
                questionsArray = possibleArray;
              }
            }
          }

          if (questionsArray.length === 0) {
            throw new Error('No valid questions found in AI response structure');
          }

          return questionsArray.map(q => {
            const opts = Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];
            let correctAns = q.correctAnswer;
            if (correctAns !== undefined && correctAns !== null && correctAns !== '') {
              if (typeof correctAns === 'number') {
                if (correctAns >= 0 && correctAns < opts.length) {
                  correctAns = opts[correctAns];
                }
              } else if (typeof correctAns === 'string') {
                const trimmed = correctAns.trim();
                const optIdx = opts.map(o => String(o).trim().toLowerCase()).indexOf(trimmed.toLowerCase());
                if (optIdx >= 0) {
                  correctAns = opts[optIdx];
                } else {
                  const idxNum = Number(trimmed);
                  if (!isNaN(idxNum) && idxNum >= 0 && idxNum < opts.length) {
                    correctAns = opts[idxNum];
                  } else {
                    correctAns = trimmed;
                  }
                }
              }
            }
            return {
              question: q.question || q.questionText || 'Concept Question',
              options: opts,
              correctAnswer: correctAns || opts[0],
              explanation: q.explanation || 'Based on the video concepts.',
              difficulty: q.difficulty || difficulty || 'Medium',
              marks: typeof q.marks === 'number' ? q.marks : 1
            };
          });
        } catch (error) {
          console.warn(`[AI Assessment Chunk Attempt ${attempt}/${maxAttempts}] Generation failed:`, error.message);
          if (attempt === maxAttempts) {
            throw new Error(`AI assessment generation failed after ${maxAttempts} attempts: ${error.message}`);
          }
          const jitter = Math.random() * 2000;
          const delayMs = retryDelays[attempt - 1] + jitter;
          console.log(`Waiting ${Math.round(delayMs)}ms before retry ${attempt + 1}...`);
          await delay(delayMs);
          attempt++;
        }
      }
    };

    let allGeneratedQuestions = [];
    const chunkPromises = [];

    for (let i = 0; i < chunkCount; i++) {
      const startIdx = i * charsPerChunk;
      const endIdx = startIdx + charsPerChunk;
      const chunkText = transcript.substring(startIdx, endIdx);

      const qStart = i * questionsPerChunk + 1;
      const qEnd = Math.min((i + 1) * questionsPerChunk, totalQuestions);
      const chunkQuestionsCount = qEnd - qStart + 1;

      sendEvent({ progress: `Requesting Questions ${qStart}-${qEnd}...` });

      chunkPromises.push(
        generateChunkWithRetry(chunkText, chunkQuestionsCount).then(res => {
          sendEvent({ progress: `Received Questions ${qStart}-${qEnd}...` });
          return res;
        })
      );
    }

    const chunksResults = await Promise.all(chunkPromises);
    for (const questionsChunk of chunksResults) {
      if (Array.isArray(questionsChunk)) {
        allGeneratedQuestions = [...allGeneratedQuestions, ...questionsChunk];
      }
    }

    sendEvent({ progress: 'Finalizing Assessment...' });

    const allDbQuestions = [];
    const Quiz = require('../models/Quiz');
    const { getWordRearrangedFingerprint, calculateSimilarity, validateOptions } = require('../utils/duplicateChecker');

    try {
      const quizzes = await Quiz.find();
      for (const q of quizzes) {
        if (q.questions) allDbQuestions.push(...q.questions.map(item => item.questionText || item.question));
      }
      const courses = await Course.find();
      for (const c of courses) {
        if (c.quiz) allDbQuestions.push(...c.quiz.map(item => item.question || item.questionText));
        if (c.lessons) {
          for (const l of c.lessons) {
            if (l.quiz) allDbQuestions.push(...l.quiz.map(item => item.question || item.questionText));
          }
        }
      }
    } catch (dbErr) {
      console.warn("Failed to load DB questions for AI check, skipping database similarity check:", dbErr.message);
    }

    const dbFps = allDbQuestions.map(text => ({
      text,
      fingerprint: getWordRearrangedFingerprint(text)
    }));

    const uniqueQuestions = [];
    const retryCountPerIndex = {};

    for (let i = 0; i < allGeneratedQuestions.length; i++) {
      const q = allGeneratedQuestions[i];
      if (!q) continue;
      const qText = q.question || q.questionText || q.text || q.title || q.content;
      const options = q.options || [];

      if (!qText) continue;

      let isDuplicate = false;
      let reason = '';

      const optError = validateOptions(options, qText);
      if (optError) {
        isDuplicate = true;
        reason = optError;
      }

      if (!isDuplicate) {
        const fp = getWordRearrangedFingerprint(qText);
        for (const dbQ of dbFps) {
          if (dbQ.fingerprint === fp || calculateSimilarity(qText, dbQ.text) >= 0.85) {
            isDuplicate = true;
            reason = `Similar to existing DB question: "${dbQ.text}"`;
            break;
          }
        }
        
        if (!isDuplicate) {
          for (const accepted of uniqueQuestions) {
            const acceptedText = accepted.question || accepted.questionText || accepted.text || accepted.title || accepted.content;
            if (getWordRearrangedFingerprint(acceptedText) === fp || calculateSimilarity(qText, acceptedText) >= 0.85) {
              isDuplicate = true;
              reason = `Similar to another generated question in this batch: "${acceptedText}"`;
              break;
            }
          }
        }
      }

      if (isDuplicate) {
        const key = `${i}-${qText}`;
        const retries = retryCountPerIndex[key] || 0;
        if (retries < 2) {
          retryCountPerIndex[key] = retries + 1;
          console.log(`[AI Gen] Duplicate question detected: "${qText}". Reason: ${reason}. Auto-regenerating unique replacement (Retry ${retries + 1}/2)...`);
          sendEvent({ progress: `Regenerating similar/duplicate question...` });
          
          try {
            const regenPrompt = `Analyze the topic and generate a completely unique multiple-choice question that is NOT similar or duplicate to the following:
1. "${qText}"
2. Any of these: ${allDbQuestions.slice(0, 10).map(x => `"${x}"`).join(', ')} (and general database questions).
 
Ensure:
- Meaningful question statement.
- Exactly 4 unique choices (no blank options, no duplicate options, no nearly-identical options).
- Unique detailed explanation.
- Return the result strictly as a single JSON object (not array) with format:
{
  "question": "Unique question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option A",
  "explanation": "Detailed explanation matching correct answer.",
  "difficulty": "${difficulty || 'Medium'}",
  "marks": 1
}
No markdown wrappers, just raw JSON.`;
 
            const result = await model.generateContent(regenPrompt);
            let responseText = result.response.text().trim();
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const newQ = JSON.parse(responseText);
            if (newQ && (newQ.question || newQ.questionText)) {
              const opts = Array.isArray(newQ.options) && newQ.options.length === 4 ? newQ.options : ['Option A', 'Option B', 'Option C', 'Option D'];
              let correctAns = newQ.correctAnswer;
              if (correctAns !== undefined && correctAns !== null && correctAns !== '') {
                if (typeof correctAns === 'number') {
                  if (correctAns >= 0 && correctAns < opts.length) {
                    correctAns = opts[correctAns];
                  }
                } else if (typeof correctAns === 'string') {
                  const trimmed = correctAns.trim();
                  const optIdx = opts.map(o => String(o).trim().toLowerCase()).indexOf(trimmed.toLowerCase());
                  if (optIdx >= 0) {
                    correctAns = opts[optIdx];
                  } else {
                    const idxNum = Number(trimmed);
                    if (!isNaN(idxNum) && idxNum >= 0 && idxNum < opts.length) {
                      correctAns = opts[idxNum];
                    } else {
                      correctAns = trimmed;
                    }
                  }
                }
              }
              const standardized = {
                question: newQ.question || newQ.questionText || 'Concept Question',
                options: opts,
                correctAnswer: correctAns || opts[0],
                explanation: newQ.explanation || 'Based on the video concepts.',
                difficulty: newQ.difficulty || difficulty || 'Medium',
                marks: typeof newQ.marks === 'number' ? newQ.marks : 1
              };
              allGeneratedQuestions[i] = standardized;
              i--; 
              continue;
            }
          } catch (regenErr) {
            console.error("Failed to generate unique replacement:", regenErr.message);
          }
        } else {
          console.warn(`[AI Gen] Max retries reached for index ${i}. Skipping question to preserve integrity.`);
        }
      } else {
        uniqueQuestions.push(q);
      }
    }

    const finalSet = uniqueQuestions.slice(0, totalQuestions);

    sendEvent({ progress: 'Assessment Ready', result: finalSet });
    res.end();

  } catch (error) {
    console.error('AI Assessment Generation Error:', error);
    sendEvent({ error: error.message || 'AI generation temporarily unavailable. Please try again later.' });
    res.end();
  }
};

const regenerateSingleQuestion = async (req, res) => {
  try {
    const { transcript, existingQuestions = [], difficulty, language } = req.body;
    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ message: 'Transcript content is missing or empty.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ message: 'GEMINI_API_KEY is not configured in the server environment.' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze the educational transcript and generate a completely unique multiple-choice question that is NOT similar to any of these existing questions:
${existingQuestions.map((q, i) => `${i+1}. "${q}"`).join('\n')}

Ensure:
1. Question statement is meaningful, specific, and derived from the transcript. Do not generate generic or placeholder questions.
2. Exactly 4 unique options.
3. Identify the actual correct answer from transcript and store its exact text value in "correctAnswer".
4. Provide a detailed explanation.
5. Return strictly a JSON object:
{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option A",
  "explanation": "Detailed explanation.",
  "difficulty": "${difficulty || 'Medium'}",
  "marks": 1
}`;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    let attempt = 1;
    const maxAttempts = 3;
    const retryDelays = [3000, 6000, 12000];
    let newQ = null;

    while (attempt <= maxAttempts) {
      try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        if (responseText.startsWith("```")) {
          responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        } else {
          const jsonStart = responseText.indexOf('{');
          if (jsonStart !== -1) {
            const jsonEnd = responseText.lastIndexOf('}');
            if (jsonEnd !== -1 && jsonEnd > jsonStart) {
              responseText = responseText.substring(jsonStart, jsonEnd + 1);
            }
          }
        }
        newQ = JSON.parse(responseText);
        if (newQ && (newQ.question || newQ.questionText)) {
          break;
        }
        throw new Error('Invalid question response format');
      } catch (err) {
        console.warn(`[Single Question Regen Attempt ${attempt}/${maxAttempts}] Failed:`, err.message);
        if (attempt === maxAttempts) {
          throw new Error(`Failed to regenerate question after ${maxAttempts} attempts: ${err.message}`);
        }
        const jitter = Math.random() * 2000;
        await delay(retryDelays[attempt - 1] + jitter);
        attempt++;
      }
    }

    const opts = Array.isArray(newQ.options) && newQ.options.length === 4 ? newQ.options : ['Option A', 'Option B', 'Option C', 'Option D'];
    let correctAns = newQ.correctAnswer;
    if (correctAns !== undefined && correctAns !== null && correctAns !== '') {
      if (typeof correctAns === 'number') {
        if (correctAns >= 0 && correctAns < opts.length) {
          correctAns = opts[correctAns];
        }
      } else if (typeof correctAns === 'string') {
        const trimmed = correctAns.trim();
        const optIdx = opts.map(o => String(o).trim().toLowerCase()).indexOf(trimmed.toLowerCase());
        if (optIdx >= 0) {
          correctAns = opts[optIdx];
        } else {
          const idxNum = Number(trimmed);
          if (!isNaN(idxNum) && idxNum >= 0 && idxNum < opts.length) {
            correctAns = opts[idxNum];
          } else {
            correctAns = trimmed;
          }
        }
      }
    }

    const standardized = {
      question: newQ.question || newQ.questionText || 'Concept Question',
      options: opts,
      correctAnswer: correctAns || opts[0],
      explanation: newQ.explanation || 'Based on the video concepts.',
      difficulty: newQ.difficulty || difficulty || 'Medium',
      marks: typeof newQ.marks === 'number' ? newQ.marks : 1
    };

    res.json(standardized);
  } catch (error) {
    console.error('Failed to regenerate single question:', error);
    res.status(500).json({ message: 'Error regenerating question: ' + error.message });
  }
};

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse, generateQuizFromYoutube, generateAIAssessment, enrollInCourse, unenrollInCourse, completeCourse, completeLesson, completeTask, regenerateSingleQuestion };
