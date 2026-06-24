const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');
const Course = require('../models/Course');
const Attempt = require('../models/Attempt');
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

const parseAnswersToOptions = (value, options) => {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  
  const normalizedOptions = (options || []).map(opt => String(opt).trim().toLowerCase());
  
  let rawItems = [];
  if (Array.isArray(value)) {
    rawItems = value;
  } else if (typeof value === 'string') {
    const trimmedVal = value.trim();
    if (trimmedVal.startsWith('[') && trimmedVal.endsWith(']')) {
      try {
        rawItems = JSON.parse(trimmedVal);
        if (!Array.isArray(rawItems)) {
          rawItems = [rawItems];
        }
      } catch (e) {
        rawItems = trimmedVal.split(',').map(s => s.trim());
      }
    } else {
      rawItems = trimmedVal.split(',').map(s => s.trim());
    }
  } else {
    rawItems = [value];
  }
  
  const result = [];
  for (const item of rawItems) {
    if (item === undefined || item === null || String(item).trim() === '') {
      continue;
    }
    const strItem = String(item).trim();
    
    // Check if it matches an option exactly (case-insensitive)
    const lowerItem = strItem.toLowerCase();
    const optIdx = normalizedOptions.indexOf(lowerItem);
    if (optIdx >= 0) {
      result.push(lowerItem);
      continue;
    }
    
    // Check if it is a valid index
    const idx = Number(strItem);
    if (!isNaN(idx) && idx >= 0 && idx < normalizedOptions.length) {
      result.push(normalizedOptions[idx]);
      continue;
    }
    
    // Otherwise, just treat it as a string answer
    result.push(lowerItem);
  }
  
  return result;
};

const stripQuizAnswers = (quiz, isAdminOrEmployer) => {
  if (isAdminOrEmployer) return quiz;
  
  const doc = quiz.toObject ? quiz.toObject() : JSON.parse(JSON.stringify(quiz));
  
  if (doc.questions && Array.isArray(doc.questions)) {
    doc.questions = doc.questions.map(q => {
      const { correctAnswer, explanation, ...rest } = q;
      return rest;
    });
  }
  
  return doc;
};

const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('createdBy', 'name companyName role');
    const user = getUserFromRequest(req);
    const isAdminOrEmployer = user && ['admin', 'employer', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin'].includes(user.role);
    
    let filteredQuizzes = quizzes;
    if (!isAdminOrEmployer) {
      const currentUserId = user?.id || user?._id;
      filteredQuizzes = quizzes.filter(q => {
        if (!q.assignedUser) return true;
        const assignedId = q.assignedUser.toString();
        return currentUserId && assignedId === currentUserId.toString();
      });
    }

    const sanitizedQuizzes = filteredQuizzes.map(q => stripQuizAnswers(q, isAdminOrEmployer));
    res.json(sanitizedQuizzes);
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
    res.status(400).json({ message: error.message || 'Error creating quiz' });
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
      lessonIndex, // if lesson-level quiz
      quizId,      // if dedicated quiz
      attemptId,   // if attempt-based quiz
      duration, 
      trustScore, 
      warnings, 
      violationTimeline = [], 
      answers = [], 
      videoRecordingUrl,
      autoSubmitReason,
      screenshots = [],
      screenActivityLog = [],
      audioActivityLog = [],
      objectDetectionLog = [],
      aiSuspicionScore,
      submissionType
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // 1. Retrieve the questions from Attempt or DB
    let dbQuestions = [];
    let courseDoc = null;
    let quizDoc = null;
    let attemptDoc = null;

    if (attemptId) {
      attemptDoc = await Attempt.findById(attemptId);
      if (!attemptDoc) {
        return res.status(404).json({ message: 'Attempt not found' });
      }
      if (attemptDoc.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Attempt does not belong to this user.' });
      }
      dbQuestions = attemptDoc.questions || [];
      if (attemptDoc.quiz) {
        quizDoc = await Quiz.findById(attemptDoc.quiz);
      } else if (attemptDoc.course) {
        courseDoc = await Course.findById(attemptDoc.course);
      }
    } else if (quizId) {
      quizDoc = await Quiz.findById(quizId);
      if (!quizDoc) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      if (quizDoc.assignedUser && quizDoc.assignedUser.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'You are not authorized to submit this hiring exam.' });
      }
      dbQuestions = quizDoc.questions || [];
    } else if (courseId) {
      courseDoc = await Course.findById(courseId);
      if (!courseDoc) {
        return res.status(404).json({ message: 'Course not found' });
      }
      if (lessonIndex !== undefined && lessonIndex !== null && lessonIndex !== '') {
        const lIndex = parseInt(lessonIndex);
        if (courseDoc.lessons && courseDoc.lessons[lIndex]) {
          dbQuestions = courseDoc.lessons[lIndex].quiz || [];
        } else {
          return res.status(400).json({ message: 'Invalid lesson index for course' });
        }
      } else {
        dbQuestions = courseDoc.quiz || [];
      }
    } else {
      return res.status(400).json({ message: 'Either attemptId, courseId, or quizId must be provided' });
    }

    if (!dbQuestions || dbQuestions.length === 0) {
      return res.status(400).json({ message: 'No questions found for this quiz/assessment' });
    }

    // 2. Database validation check: every question must have a valid correctAnswer field
    for (let i = 0; i < dbQuestions.length; i++) {
      const q = dbQuestions[i];
      if (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === '') {
        return res.status(400).json({ message: `Predefined correct answer missing in the database for question ${i + 1}. Evaluation aborted.` });
      }
    }

    // 3. Evaluation logic
    let correctCount = 0;
    let wrongCount = 0;
    let notAttemptedCount = 0;
    const gradedAnswers = [];

    for (let i = 0; i < dbQuestions.length; i++) {
      const q = dbQuestions[i];
      const type = q.questionType || 'single';
      
      // Find candidate's answer
      const userAns = answers.find(a => a.questionIndex === i);
      const candidateAnswer = userAns ? userAns.candidateAnswer : undefined;
      
      const qText = q.question || q.questionText || '';
      const qExplanation = q.explanation || '';
      const qOptions = q.options || [];

      // Robust parsing
      const parsedCorrect = parseAnswersToOptions(q.correctAnswer, qOptions);
      const parsedUser = parseAnswersToOptions(candidateAnswer, qOptions);

      // Display cased correct options
      let correctOptionText = '';
      if (qOptions && qOptions.length > 0) {
        const correctOptionsCased = parsedCorrect.map(lowerOpt => {
          const idx = qOptions.map(o => String(o).trim().toLowerCase()).indexOf(lowerOpt);
          return idx >= 0 ? qOptions[idx] : lowerOpt;
        });
        correctOptionText = correctOptionsCased.join(', ');
      } else {
        correctOptionText = parsedCorrect.join(', ');
      }

      // Display cased user options
      let userOptionText = '';
      if (qOptions && qOptions.length > 0) {
        const userOptionsCased = parsedUser.map(lowerOpt => {
          const idx = qOptions.map(o => String(o).trim().toLowerCase()).indexOf(lowerOpt);
          return idx >= 0 ? qOptions[idx] : lowerOpt;
        });
        userOptionText = userOptionsCased.join(', ');
      } else {
        userOptionText = parsedUser.join(', ');
      }

      const isAttempted = parsedUser.length > 0;

      if (!isAttempted) {
        notAttemptedCount++;
        gradedAnswers.push({
          questionIndex: i,
          questionText: qText,
          options: qOptions,
          candidateAnswer: '',
          correctAnswer: correctOptionText,
          explanation: qExplanation,
          isCorrect: false,
          timeTaken: userAns ? userAns.timeTaken : 10,
          violationCountDuringQuestion: userAns ? userAns.violationCountDuringQuestion : 0
        });

        console.log(`Question ID: ${q._id || q.dbQuestionId || i}
User Answer: (UNANSWERED)
Correct Answer: ${JSON.stringify(correctOptionText)}
Match Result: FAIL (INCORRECT)
`);
        continue;
      }

      let isCorrect = false;

      if (type === 'single' || type === 'boolean') {
        isCorrect = (parsedCorrect.length > 0 && parsedUser[0] === parsedCorrect[0]);
      } else if (type === 'multiple') {
        if (parsedCorrect.length === parsedUser.length) {
          const sortedCorrect = [...parsedCorrect].sort();
          const sortedUser = [...parsedUser].sort();
          isCorrect = sortedCorrect.every((val, index) => val === sortedUser[index]);
        }
      } else if (type === 'text') {
        isCorrect = parsedCorrect.includes(parsedUser[0]);
      }

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      console.log(`Question ID: ${q._id || q.dbQuestionId || i}
User Answer: ${JSON.stringify(userOptionText)}
Correct Answer: ${JSON.stringify(correctOptionText)}
Match Result: ${isCorrect ? 'SUCCESS (CORRECT)' : 'FAIL (INCORRECT)'}
`);

      gradedAnswers.push({
        questionIndex: i,
        questionText: qText,
        options: qOptions,
        candidateAnswer: userOptionText,
        correctAnswer: correctOptionText,
        explanation: qExplanation,
        isCorrect: isCorrect,
        timeTaken: userAns ? userAns.timeTaken : 10,
        violationCountDuringQuestion: userAns ? userAns.violationCountDuringQuestion : 0
      });
    }

    const totalQuestions = dbQuestions.length;
    const finalScore = correctCount;

    // 4. Save results to Database
    const finalStatus = (finalScore / totalQuestions) >= 0.5 ? 'Pass' : 'Fail';

    const result = new Result({
      user: userId,
      course: courseId || (attemptDoc ? attemptDoc.course : null),
      quiz: quizId || (attemptDoc ? attemptDoc.quiz : null),
      score: finalScore,
      totalQuestions,
      duration,
      trustScore,
      warnings,
      status: finalStatus,
      violationTimeline,
      answers: gradedAnswers,
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
          courseId: courseId || (attemptDoc ? attemptDoc.course : null),
          quizId: quizId || (attemptDoc ? attemptDoc.quiz : null),
          score: finalScore,
          totalQuestions
        }
      }
    });

    // If candidate passed the quiz, check if there's an application for a job with this quiz, and update its examResult
    const activeQuizId = quizId || (attemptDoc ? attemptDoc.quiz : null);
    if (activeQuizId && finalStatus === 'Pass') {
      try {
        const Application = require('../models/Application');
        const Job = require('../models/Job');
        const Notification = require('../models/Notification');
        const { sendEmail } = require('../utils/emailService');

        // Find jobs linked to this quiz
        const jobs = await Job.find({ examId: activeQuizId });
        const jobIds = jobs.map(j => j._id);

        if (jobIds.length > 0) {
          // Update existing applications to shortlisted
          const updateResult = await Application.updateMany(
            { studentId: userId, jobId: { $in: jobIds }, status: { $ne: 'hired' } },
            {
              status: 'shortlisted',
              examResult: {
                score: finalScore,
                totalQuestions,
                completedAt: new Date()
              }
            }
          );

          // If any applications were updated, send notifications and email
          if (updateResult.modifiedCount > 0) {
            const student = await User.findById(userId);
            const scorePercent = Math.round((finalScore / totalQuestions) * 100);

            for (const job of jobs) {
              // In-app notification for the student
              try {
                await new Notification({
                  user: userId,
                  title: '🎉 You Are Shortlisted!',
                  message: `Great news! You scored ${scorePercent}% and have been shortlisted for "${job.title}" at ${job.companyName}. Watch for an interview invitation!`,
                  type: 'success',
                  link: '/dashboard/hiring'
                }).save();
              } catch (notifErr) {
                console.error('Failed to save shortlist notification for student:', notifErr);
              }

              // In-app notification for the employer
              try {
                await new Notification({
                  user: job.postedBy,
                  title: `🏆 Exam Cleared: ${student?.name || 'A candidate'}`,
                  message: `${student?.name || 'A candidate'} has passed your screening exam for "${job.title}" with a score of ${scorePercent}%. They are now shortlisted. Schedule their interview!`,
                  type: 'success',
                  link: '/employer/applications'
                }).save();
              } catch (notifErr) {
                console.error('Failed to save shortlist notification for employer:', notifErr);
              }

              // Email notification to the student
              if (student?.email) {
                sendEmail({
                  to: student.email,
                  subject: `🎉 Exam Passed & Shortlisted: ${job.title} at ${job.companyName}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
                      <div style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #fff; margin: 0; font-size: 24px;">🎉 You Passed & You're Shortlisted!</h2>
                      </div>
                      <p>Dear ${student.name},</p>
                      <p>Congratulations! You have successfully passed the screening exam for <strong>${job.title}</strong> at <strong>${job.companyName}</strong>!</p>
                      <div style="background-color: #f0f7ff; border-left: 4px solid #1a73e8; padding: 16px 20px; margin: 20px 0; border-radius: 6px;">
                        <h4 style="margin: 0 0 10px 0; color: #1a73e8;">📊 Your Exam Results</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 5px 0; font-weight: bold; color: #555; width: 150px;">Score:</td>
                            <td style="padding: 5px 0; color: #222;"><strong>${finalScore}/${totalQuestions} (${scorePercent}%)</strong></td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0; font-weight: bold; color: #555;">Status:</td>
                            <td style="padding: 5px 0; color: #28a745;"><strong>✅ PASSED</strong></td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0; font-weight: bold; color: #555;">Position:</td>
                            <td style="padding: 5px 0; color: #222;">${job.title}</td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0; font-weight: bold; color: #555;">Company:</td>
                            <td style="padding: 5px 0; color: #222;">${job.companyName}</td>
                          </tr>
                        </table>
                      </div>
                      <div style="background-color: #d4edda; border-radius: 6px; padding: 14px 20px; margin: 16px 0;">
                        <p style="margin: 0; color: #155724;"><strong>🏆 You are now shortlisted!</strong> The hiring team will review your profile and reach out to schedule a virtual interview. Keep an eye on your email and dashboard notifications.</p>
                      </div>
                      <p>Best of luck in your interview. The Green Skills team is rooting for you!</p>
                      <br>
                      <p>Best regards,</p>
                      <p><strong>Green Skills Recruitment Portal</strong></p>
                    </div>
                  `
                }).catch((emailErr) => {
                  console.error('Failed to send exam-pass shortlist email to student (handled asynchronously):', emailErr);
                });
              }
            }
          }
        }
      } catch (appErr) {
        console.error('Error updating Application status and examResult on quiz pass:', appErr);
      }
    }

    // Mark attempt as completed
    if (attemptDoc) {
      attemptDoc.isCompleted = true;
      attemptDoc.userAnswers = answers.reduce((acc, a) => {
        acc[a.questionIndex] = a.candidateAnswer;
        return acc;
      }, {});
      attemptDoc.markModified('userAnswers');
      await attemptDoc.save();
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Submit Quiz Error:', error);
    res.status(500).json({ message: 'Error submitting quiz: ' + error.message });
  }
};

const getAllResults = async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { user: userId } : {};
    const results = await Result.find(query)
      .populate('user', 'name email profilePicture')
      .populate('course', 'title category')
      .populate('quiz', 'title');
    res.json(results);
  } catch (error) {
    console.error('[getAllResults] Error:', error);
    res.status(500).json({ message: 'Error fetching results' });
  }
};

// Fast endpoint: returns only the single most recent course-based result for a user
const getLatestCourseResult = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const result = await Result.findOne({ user: userId, course: { $exists: true, $ne: null } })
      .sort({ completedAt: -1 })
      .limit(1)
      .populate('course', 'title category')
      .lean();
    res.json(result || null);
  } catch (error) {
    console.error('[getLatestCourseResult] Error:', error);
    res.status(500).json({ message: 'Error fetching latest result' });
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
    "correctAnswer": "Option A", // The exact text value of the correct option
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
          questions = parsedQuestions.map(q => {
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
              questionText: q.questionText || q.question || 'Concept Question',
              options: opts,
              correctAnswer: correctAns || opts[0],
              explanation: q.explanation || 'Based on the video concepts.'
            };
          });
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
            const formattedQuestions = quiz.questions.map(q => {
              let correctAns = q.correctAnswer;
              if (typeof correctAns === 'number') {
                correctAns = q.options[correctAns];
              } else if (typeof correctAns === 'string') {
                const trimmed = correctAns.trim();
                const optIdx = q.options.map(o => String(o).trim().toLowerCase()).indexOf(trimmed.toLowerCase());
                if (optIdx >= 0) {
                  correctAns = q.options[optIdx];
                } else {
                  const idxNum = Number(trimmed);
                  if (!isNaN(idxNum) && idxNum >= 0 && idxNum < q.options.length) {
                    correctAns = q.options[idxNum];
                  } else {
                    correctAns = trimmed;
                  }
                }
              }
              return {
                question: q.questionText,
                options: q.options,
                correctAnswer: correctAns,
                explanation: q.explanation
              };
            });
            course.lessons[lessonIndex].quiz = formattedQuestions;
            await course.save();
          }
        } else {
           // Append to course level quiz
           const formattedQuestions = quiz.questions.map(q => {
            let correctAns = q.correctAnswer;
            if (typeof correctAns === 'number') {
              correctAns = q.options[correctAns];
            } else if (typeof correctAns === 'string') {
              const trimmed = correctAns.trim();
              const optIdx = q.options.map(o => String(o).trim().toLowerCase()).indexOf(trimmed.toLowerCase());
              if (optIdx >= 0) {
                correctAns = q.options[optIdx];
              } else {
                const idxNum = Number(trimmed);
                if (!isNaN(idxNum) && idxNum >= 0 && idxNum < q.options.length) {
                  correctAns = q.options[idxNum];
                } else {
                  correctAns = trimmed;
                }
              }
            }
            return {
              question: q.questionText,
              options: q.options,
              correctAnswer: correctAns,
              explanation: q.explanation
            };
          });
          course.quiz = formattedQuestions;
          await course.save();
        }
      }
    }

    res.json({ message: 'Quiz published successfully', quiz });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Error publishing quiz' });
  }
};

const startQuizAttempt = async (req, res) => {
  try {
    const { userId, courseId, quizId, lessonIndex } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    let quizDoc = null;
    if (quizId) {
      quizDoc = await Quiz.findById(quizId);
      if (!quizDoc) return res.status(404).json({ message: 'Quiz not found' });
      if (quizDoc.assignedUser && quizDoc.assignedUser.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'You are not authorized to attempt this hiring exam.' });
      }
    }

    const query = {
      user: userId,
      isCompleted: false
    };
    if (courseId) query.course = courseId;
    if (quizId) query.quiz = quizId;
    if (lessonIndex !== undefined && lessonIndex !== null && lessonIndex !== '') {
      query.lessonIndex = parseInt(lessonIndex);
    }

    // Check for existing uncompleted attempt
    let attempt = await Attempt.findOne(query);

    const quizDurationMinutes = 30; // default duration is 30 mins
    const limitMs = quizDurationMinutes * 60 * 1000;

    if (attempt) {
      const elapsed = Date.now() - new Date(attempt.startedAt).getTime();
      if (elapsed > limitMs) {
        attempt.isCompleted = true;
        await attempt.save();
        attempt = null; // force creation of a new one
      }
    }

    if (attempt) {
      // Return existing attempt with stripped correct answers
      const attemptObj = attempt.toObject();
      attemptObj.questions = attemptObj.questions.map(q => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
      const timeLeft = Math.max(0, Math.floor((limitMs - (Date.now() - new Date(attempt.startedAt).getTime())) / 1000));
      return res.json({
        attemptId: attempt._id,
        questions: attemptObj.questions,
        userAnswers: attempt.userAnswers || {},
        timeLeft
      });
    }

    // Create a new attempt
    let sourceQuestions = [];
    if (quizId) {
      sourceQuestions = quizDoc.questions || [];
    } else if (courseId) {
      const courseDoc = await Course.findById(courseId);
      if (!courseDoc) return res.status(404).json({ message: 'Course not found' });
      if (lessonIndex !== undefined && lessonIndex !== null && lessonIndex !== '') {
        const lIdx = parseInt(lessonIndex);
        if (courseDoc.lessons && courseDoc.lessons[lIdx]) {
          sourceQuestions = courseDoc.lessons[lIdx].quiz || [];
        }
      } else {
        sourceQuestions = courseDoc.quiz || [];
      }
    }

    if (!sourceQuestions || sourceQuestions.length === 0) {
      return res.status(400).json({ message: 'No questions found for this quiz/assessment' });
    }

    // Deduplicate and filter highly similar questions from the pool
    const { getWordRearrangedFingerprint, calculateSimilarity } = require('../utils/duplicateChecker');
    const uniquePool = [];
    for (const q of sourceQuestions) {
      const qText = q.question || q.questionText;
      if (!qText) continue;
      const qFp = getWordRearrangedFingerprint(qText);
      
      let isDup = false;
      for (const accepted of uniquePool) {
        const acceptedText = accepted.question || accepted.questionText;
        if (getWordRearrangedFingerprint(acceptedText) === qFp || calculateSimilarity(qText, acceptedText) >= 0.85) {
          isDup = true;
          break;
        }
      }
      if (!isDup) {
        uniquePool.push(q);
      }
    }

    // Shuffling
    const shuffled = [...uniquePool].sort(() => 0.5 - Math.random());
    const targetSize = sourceQuestions.length; // Keep target size as original count
    const selectedQuestions = shuffled.slice(0, targetSize).map(q => ({
      questionText: q.questionText || q.question,
      options: q.options || [],
      questionType: q.questionType || 'single',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      dbQuestionId: q._id ? q._id.toString() : undefined
    }));

    attempt = new Attempt({
      user: userId,
      course: courseId || null,
      quiz: quizId || null,
      lessonIndex: (lessonIndex !== undefined && lessonIndex !== null && lessonIndex !== '') ? parseInt(lessonIndex) : undefined,
      questions: selectedQuestions,
      userAnswers: {},
      startedAt: new Date(),
      isCompleted: false
    });

    await attempt.save();

    const attemptObj = attempt.toObject();
    attemptObj.questions = attemptObj.questions.map(q => {
      const { correctAnswer, explanation, ...rest } = q;
      return rest;
    });

    res.status(201).json({
      attemptId: attempt._id,
      questions: attemptObj.questions,
      userAnswers: {},
      timeLeft: Math.floor(limitMs / 1000),
      warning: uniquePool.length < sourceQuestions.length ? 'Some duplicate questions were filtered from the pool.' : undefined
    });
  } catch (error) {
    console.error('Start Attempt Error:', error);
    res.status(500).json({ message: 'Error starting quiz attempt: ' + error.message });
  }
};

const saveQuizProgress = async (req, res) => {
  try {
    const { attemptId, userAnswers } = req.body;
    if (!attemptId) {
      return res.status(400).json({ message: 'Attempt ID is required' });
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.isCompleted) {
      return res.status(400).json({ message: 'Cannot update progress of a completed attempt' });
    }

    attempt.userAnswers = userAnswers || {};
    attempt.markModified('userAnswers');
    await attempt.save();

    res.json({ message: 'Progress saved successfully' });
  } catch (error) {
    console.error('Save Progress Error:', error);
    res.status(500).json({ message: 'Error saving progress: ' + error.message });
  }
};

const getIntegrityReport = async (req, res) => {
  try {
    const { generateIntegrityReport } = require('../utils/duplicateChecker');
    const report = await generateIntegrityReport();
    res.json(report);
  } catch (error) {
    console.error('Integrity Report Error:', error);
    res.status(500).json({ message: 'Error generating integrity report: ' + error.message });
  }
};

const invalidateResultScore = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the Result document
    const resultDoc = await Result.findById(id);
    if (!resultDoc) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Set score to 0, status to 'Fail', and isInvalidated to true
    resultDoc.score = 0;
    resultDoc.status = 'Fail';
    resultDoc.isInvalidated = true;
    await resultDoc.save();

    // Pull from the User's quizScores array matching this course
    if (resultDoc.course) {
      await User.findByIdAndUpdate(resultDoc.user, {
        $pull: {
          quizScores: {
            courseId: resultDoc.course
          }
        }
      });
    }

    res.json({ message: 'Score successfully invalidated', result: resultDoc });
  } catch (error) {
    console.error('Invalidate score error:', error);
    res.status(500).json({ message: 'Error invalidating score: ' + error.message });
  }
};

module.exports = {
  getAllQuizzes,
  submitQuiz,
  createQuiz,
  getQuizzesByEmployer,
  generateFromYoutube,
  publishQuiz,
  getAllResults,
  getLatestCourseResult,
  startQuizAttempt,
  saveQuizProgress,
  getIntegrityReport,
  invalidateResultScore
};
