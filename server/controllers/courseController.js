const Course = require('../models/Course');
const User = require('../models/User');
const { processVideo } = require('../utils/videoProcessor');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
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
    res.status(500).json({ message: 'Error creating course' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Trigger background processing for YouTube links
    triggerVideoProcessing(course);

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error updating course' });
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

    // Mock AI Quiz Generation
    const mockQuestions = [];
    for (let i = 1; i <= 50; i++) {
      mockQuestions.push({
        question: `Question ${i}: Related to ${course.title} content?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A'
      });
    }

    // Generate 20 Mock Lessons if they don't exist
    if (!course.lessons || course.lessons.length === 0) {
      const mockLessons = [];
      for (let i = 1; i <= 20; i++) {
        mockLessons.push({
          title: `Lesson ${i}: Master Class`,
          videoSource: 'youtube',
          youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration: '10:00'
        });
      }
      course.lessons = mockLessons;
    }

    // Generate 5 Mock Tasks if they don't exist
    if (!course.tasks || course.tasks.length === 0) {
      const mockTasks = [];
      for (let i = 1; i <= 5; i++) {
        mockTasks.push({
          title: `Task ${i}: Industrial Assignment`,
          description: `Practical task related to lesson ${i * 6}`,
          type: 'Practical'
        });
      }
      course.tasks = mockTasks;
    }

    course.quiz = mockQuestions;
    await course.save();
    res.json({ message: 'Course nodes (20 lessons, 5 tasks, 50 MCQ) generated successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Error generating course content' });
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
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const totalQuestions = parseInt(numQuestions) || 50;
    const questionsPerChunk = 10;
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
      7. Provide the correct answer index (0-3).
      8. Provide a detailed, highly specific explanation based on the transcript to justify the answer.
      9. Return the result strictly as a JSON array of objects.

      Expected JSON format:
      [
        {
          "question": "Actual question text extracted from transcript logic",
          "options": ["Meaningful Option A", "Meaningful Option B", "Meaningful Option C", "Meaningful Option D"],
          "correctAnswer": 0,
          "explanation": "Actual explanation based on transcript content.",
          "difficulty": "Easy/Medium/Hard"
        }
      ]

      Transcript chunk:
      ${chunkText}
      `;

      let attempt = 1;
      const maxAttempts = 3;
      const retryDelays = [5000, 10000, 20000]; // 5s, 10s, 20s

      while (attempt <= maxAttempts) {
        try {
          const result = await model.generateContent(prompt);
          let responseText = result.response.text();
          responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(responseText);
        } catch (error) {
          const status = error.status || error.response?.status;
          if (status === 429 || status === 503 || status === 504) {
            if (attempt === maxAttempts) throw new Error('AI generation temporarily unavailable. Please try again later.');
            console.log(`Rate limit hit, waiting ${retryDelays[attempt - 1]}ms before retry ${attempt + 1}...`);
            await delay(retryDelays[attempt - 1]);
            attempt++;
          } else {
            throw error; // If it's a parsing error or other 4xx error, throw it
          }
        }
      }
    };

    let allGeneratedQuestions = [];

    for (let i = 0; i < chunkCount; i++) {
      const startIdx = i * charsPerChunk;
      const endIdx = startIdx + charsPerChunk;
      const chunkText = transcript.substring(startIdx, endIdx);

      const qStart = i * questionsPerChunk + 1;
      const qEnd = Math.min((i + 1) * questionsPerChunk, totalQuestions);
      const chunkQuestionsCount = qEnd - qStart + 1;

      sendEvent({ progress: `Generating Questions ${qStart}-${qEnd}...` });

      const questionsChunk = await generateChunkWithRetry(chunkText, chunkQuestionsCount);

      if (Array.isArray(questionsChunk)) {
        allGeneratedQuestions = [...allGeneratedQuestions, ...questionsChunk];
      }
    }

    sendEvent({ progress: 'Finalizing Assessment...' });

    // Deduplicate Questions based on exact text matching to ensure 50 unique questions
    const uniqueQuestions = [];
    const seenTexts = new Set();

    for (const q of allGeneratedQuestions) {
      const qText = q && (q.question || q.questionText || q.text || q.title || q.content);
      if (qText && String(qText).trim() !== '' && !seenTexts.has(String(qText).toLowerCase().trim())) {
        seenTexts.add(String(qText).toLowerCase().trim());
        uniqueQuestions.push(q);
      }
    }

    // Ensure we don't return more than requested, though duplicate removal might reduce it below totalQuestions.
    // In a perfectly resilient system we would generate more to make up the difference, but we return the valid set here.
    const finalSet = uniqueQuestions.slice(0, totalQuestions);

    sendEvent({ progress: 'Assessment Ready', result: finalSet });
    res.end();

  } catch (error) {
    console.error('AI Assessment Generation Error:', error);
    sendEvent({ error: error.message || 'AI generation temporarily unavailable. Please try again later.' });
    res.end();
  }
};

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse, generateQuizFromYoutube, generateAIAssessment, enrollInCourse, unenrollInCourse, completeCourse, completeLesson, completeTask };
