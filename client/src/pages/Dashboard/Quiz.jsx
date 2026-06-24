import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Award, Clock, ArrowRight, CheckCircle2, XCircle, PlayCircle, Star, Video, Mic, ShieldAlert, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const Quiz = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [employerQuizzes, setEmployerQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(() => {
    if (location.state?.activeQuiz) {
      localStorage.setItem('active_quiz_meta', JSON.stringify(location.state.activeQuiz));
      return location.state.activeQuiz;
    }
    const saved = localStorage.getItem('active_quiz_meta');
    try {
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse active_quiz_meta from localStorage:", e);
      localStorage.removeItem('active_quiz_meta');
      return null;
    }
  });
  const [attemptId, setAttemptId] = useState(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const saved = localStorage.getItem('quiz_current_question');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState(null);

  // User quiz attempt states
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  // Anti-Cheating & Assessment State
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [warnings, setWarnings] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userAnswers, setUserAnswers] = useState(() => {
    const saved = localStorage.getItem('quiz_user_answers');
    try {
      return saved && saved !== 'undefined' ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse quiz_user_answers from localStorage:", e);
      localStorage.removeItem('quiz_user_answers');
      return {};
    }
  });
  const [questionStatus, setQuestionStatus] = useState({}); // 'not_visited', 'visited', 'answered', 'marked'
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [proctorStream, setProctorStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [streamActive, setStreamActive] = useState(false);
  const [trustScore, setTrustScore] = useState(100);
  const [submissionTypeState, setSubmissionTypeState] = useState('Normal Submission');
  const isProctoringReady = useRef(false);
  const consecutiveNoFaceCount = useRef(0);
  const consecutiveMultipleFacesCount = useRef(0);
  const consecutiveLookingAwayCount = useRef(0);
  const consecutiveIdentityMismatchCount = useRef(0);
  const [registeredFaceEmbedding, setRegisteredFaceEmbedding] = useState(null);

  // Advanced Enterprise-Grade Proctoring States
  const [violationTimeline, setViolationTimeline] = useState([]);
  const [screenActivityLog, setScreenActivityLog] = useState([]);
  const [audioActivityLog, setAudioActivityLog] = useState([]);
  const [objectDetectionLog, setObjectDetectionLog] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [highSeverityCount, setHighSeverityCount] = useState(0);
  const [criticalSeverityCount, setCriticalSeverityCount] = useState(0);
  const [phoneDetectionCount, setPhoneDetectionCount] = useState(0);
  const [activeBox, setActiveBox] = useState(null);
  const [autoSubmitReasonState, setAutoSubmitReasonState] = useState('');

  // Pre-assessment Face Verification methods removed

  useEffect(() => {
    if (proctorStream && videoRef.current) {
      videoRef.current.srcObject = proctorStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(e => console.error("Proctoring video play failed:", e));
      };
    }
  }, [proctorStream, activeQuiz]);

  useEffect(() => {
    fetchCoursesWithQuizzes();
    fetchUserAttempts();
  }, []);

  const fetchUserAttempts = async () => {
    try {
      const savedUserStr = localStorage.getItem('user');
      let savedUser = null;
      try {
        savedUser = savedUserStr && savedUserStr !== 'undefined' ? JSON.parse(savedUserStr) : null;
      } catch (e) {
        console.error("Failed to parse user in fetchUserAttempts:", e);
      }
      const currentUserId = (user?.id || user?._id || savedUser?.id || savedUser?._id)?.toString();
      
      const res = await axios.get(`${API_URL}/quizzes/results`, {
        params: { userId: currentUserId }
      });
      
      const userResults = res.data;
      userResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      setAttempts(userResults);
    } catch (err) {
      console.error("Failed to load user attempts:", err);
    }
  };

  const fetchCoursesWithQuizzes = async () => {
    try {
      const [coursesRes, quizzesRes] = await Promise.all([
        axios.get(`${API_URL}/courses`),
        axios.get(`${API_URL}/quizzes`)
      ]);
      
      // Filter only courses that have quizzes generated
      const availableQuizzes = coursesRes.data.filter(c => c.quiz && c.quiz.length > 0);
      setCourses(availableQuizzes);

      // Filter quizzes that are published and not course-bound
      const savedUserStr = localStorage.getItem('user');
      let savedUser = null;
      try {
        savedUser = savedUserStr && savedUserStr !== 'undefined' ? JSON.parse(savedUserStr) : null;
      } catch (e) {
        console.error("Failed to parse user in fetchCoursesWithQuizzes:", e);
      }
      const currentUserId = user?.id || user?._id || savedUser?.id || savedUser?._id;

      const availableStandalone = quizzesRes.data.filter(q => {
        if (!q.isPublished || q.courseId) return false;
        if (q.assignedUser) {
          const assignedId = q.assignedUser._id || q.assignedUser;
          return currentUserId && assignedId.toString() === currentUserId.toString();
        }
        return true;
      });
      setEmployerQuizzes(availableStandalone);
    } catch (error) {
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const startAttempt = async (quizToStart) => {
    try {
      setAttemptLoading(true);
      const savedUserStr = localStorage.getItem('user');
      let savedUser = null;
      try {
        savedUser = savedUserStr && savedUserStr !== 'undefined' ? JSON.parse(savedUserStr) : null;
      } catch (e) {
        console.error("Failed to parse user in startAttempt:", e);
      }
      const currentUserId = user?.id || user?._id || savedUser?.id || savedUser?._id;
      
      if (!currentUserId) {
        toast.error("User session not found. Please log in.");
        setActiveQuiz(null);
        return;
      }

      const isCourse = quizToStart.lessonIndex !== undefined || quizToStart.quiz !== undefined;
      const payload = {
        userId: currentUserId,
        courseId: isCourse ? quizToStart._id : undefined,
        quizId: !isCourse ? quizToStart._id : undefined,
        lessonIndex: quizToStart.lessonIndex
      };

      const response = await axios.post(`${API_URL}/quizzes/start-attempt`, payload);
      const { attemptId: newAttemptId, questions, userAnswers: savedUserAnswers, timeLeft: newTimeLeft } = response.data;
      
      setAttemptId(newAttemptId);
      setTimeLeft(newTimeLeft);

      // Load/merge saved answers from database and local storage
      const localAnswersStr = localStorage.getItem('quiz_user_answers');
      let localAnswers = {};
      try {
        localAnswers = localAnswersStr && localAnswersStr !== 'undefined' ? JSON.parse(localAnswersStr) : {};
      } catch (e) {
        console.error("Failed to parse quiz_user_answers inside startAttempt:", e);
      }
      const mergedAnswers = { ...savedUserAnswers, ...localAnswers };
      setUserAnswers(mergedAnswers);
      localStorage.setItem('quiz_user_answers', JSON.stringify(mergedAnswers));
      
      setActiveQuiz(prev => ({
        ...prev,
        quiz: questions,
        isStandalone: !isCourse
      }));
      
      const initialStatus = {};
      questions.forEach((_, i) => {
        initialStatus[i] = (mergedAnswers[i] !== undefined && String(mergedAnswers[i]).trim() !== '') ? 'answered' : 'not_visited';
      });
      initialStatus[currentQuestion] = 'visited';
      setQuestionStatus(initialStatus);
    } catch (err) {
      console.error("Failed to start or resume assessment attempt:", err);
      toast.error(err.response?.data?.message || "Failed to start assessment attempt.");
      setActiveQuiz(null);
    } finally {
      setAttemptLoading(false);
    }
  };

  useEffect(() => {
    if (activeQuiz && !attemptId && !attemptLoading) {
      startAttempt(activeQuiz);
    }
  }, [activeQuiz, attemptId]);

  useEffect(() => {
    localStorage.setItem('quiz_current_question', currentQuestion.toString());
  }, [currentQuestion]);

  useEffect(() => {
    localStorage.setItem('quiz_user_answers', JSON.stringify(userAnswers));
  }, [userAnswers]);

  useEffect(() => {
    if (!attemptId) return;
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        await axios.post(`${API_URL}/quizzes/save-progress`, {
          attemptId,
          userAnswers
        });
      } catch (err) {
        console.error("Failed to auto-save quiz progress:", err);
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [userAnswers, attemptId]);



  // Anti-Cheating & Assessment State (Moved to top of component to prevent TDZ ReferenceError)

  const getCorrectOptionText = (q) => {
    if (!q) return null;
    if (q.correctAnswer === undefined || q.correctAnswer === null) return null;
    const isNumeric = typeof q.correctAnswer === 'number' || (!isNaN(q.correctAnswer) && !isNaN(parseFloat(q.correctAnswer)));
    if (isNumeric) {
      const idx = Number(q.correctAnswer);
      if (q.options && Array.isArray(q.options) && idx >= 0 && idx < q.options.length) {
        return q.options[idx];
      }
    }
    return String(q.correctAnswer);
  };

  // Advanced Enterprise-Grade Proctoring States (Moved to top of component to prevent TDZ ReferenceError)

  // 120 Violations Catalog Registry
  const VIOLATIONS_REGISTRY = {
    1: { id: 1, name: "Excessive Tab Switching", severity: "high", category: "Browser" },
    2: { id: 2, name: "Browser Minimized", severity: "medium", category: "Browser" },
    3: { id: 3, name: "Browser Hidden Behind Other Windows", severity: "medium", category: "Browser" },
    4: { id: 4, name: "Opening New Browser Tab", severity: "high", category: "Browser" },
    5: { id: 5, name: "Opening New Browser Window", severity: "high", category: "Browser" },
    6: { id: 6, name: "Multiple Browser Windows", severity: "high", category: "Browser" },
    7: { id: 7, name: "Refreshing Assessment Page", severity: "medium", category: "Browser" },
    8: { id: 8, name: "Back Button Usage", severity: "low", category: "Browser" },
    9: { id: 9, name: "Forward Button Usage", severity: "low", category: "Browser" },
    10: { id: 10, name: "URL Manipulation Attempt", severity: "critical", category: "Browser" },
    11: { id: 11, name: "Opening Bookmark During Test", severity: "medium", category: "Browser" },
    12: { id: 12, name: "Opening Downloads Page", severity: "medium", category: "Browser" },
    13: { id: 13, name: "Browser Zoom Manipulation", severity: "low", category: "Browser" },
    14: { id: 14, name: "Reader Mode Activation", severity: "low", category: "Browser" },
    15: { id: 15, name: "Browser Extension Interference", severity: "medium", category: "Browser" },
    16: { id: 16, name: "Multiple Monitors Connected", severity: "high", category: "System" },
    17: { id: 17, name: "Display Configuration Changed", severity: "medium", category: "System" },
    18: { id: 18, name: "Screen Resolution Changed", severity: "low", category: "System" },
    19: { id: 19, name: "Virtual Machine Detected", severity: "critical", category: "System" },
    20: { id: 20, name: "Remote Desktop Session Detected", severity: "critical", category: "System" },
    21: { id: 21, name: "TeamViewer Detected", severity: "critical", category: "System" },
    22: { id: 22, name: "AnyDesk Detected", severity: "critical", category: "System" },
    23: { id: 23, name: "Chrome Remote Desktop Detected", severity: "critical", category: "System" },
    24: { id: 24, name: "Screen Sharing Detected", severity: "critical", category: "System" },
    25: { id: 25, name: "Mirroring Screen Detected", severity: "high", category: "System" },
    26: { id: 26, name: "External Capture Device Detected", severity: "critical", category: "System" },
    27: { id: 27, name: "Face Not Visible", severity: "high", category: "Webcam" },
    28: { id: 28, name: "Face Partially Visible", severity: "medium", category: "Webcam" },
    29: { id: 29, name: "Multiple Faces Detected", severity: "critical", category: "Webcam" },
    30: { id: 30, name: "Unknown Person Detected", severity: "high", category: "Webcam" },
    31: { id: 31, name: "Candidate Leaves Camera View", severity: "high", category: "Webcam" },
    32: { id: 32, name: "Camera Covered", severity: "high", category: "Webcam" },
    33: { id: 33, name: "Camera Blocked", severity: "high", category: "Webcam" },
    34: { id: 34, name: "Camera Disabled", severity: "critical", category: "Webcam" },
    35: { id: 35, name: "Webcam Stream Interrupted", severity: "high", category: "Webcam" },
    36: { id: 36, name: "Fake Camera Feed Detected", severity: "critical", category: "Webcam" },
    37: { id: 37, name: "Pre-recorded Video Detected", severity: "critical", category: "Webcam" },
    38: { id: 38, name: "Looking Left Frequently", severity: "medium", category: "Head Movement" },
    39: { id: 39, name: "Looking Right Frequently", severity: "medium", category: "Head Movement" },
    40: { id: 40, name: "Looking Down Frequently", severity: "medium", category: "Head Movement" },
    41: { id: 41, name: "Looking Up Frequently", severity: "medium", category: "Head Movement" },
    42: { id: 42, name: "Looking Away Continuously", severity: "high", category: "Head Movement" },
    43: { id: 43, name: "Head Not Facing Screen", severity: "high", category: "Head Movement" },
    44: { id: 44, name: "Suspicious Repetitive Movement", severity: "medium", category: "Head Movement" },
    45: { id: 45, name: "Frequent Side Glances", severity: "medium", category: "Head Movement" },
    46: { id: 46, name: "Eyes Off Screen", severity: "medium", category: "Eye Tracking" },
    47: { id: 47, name: "Reading External Material", severity: "high", category: "Eye Tracking" },
    48: { id: 48, name: "Repeated Focus Shift", severity: "medium", category: "Eye Tracking" },
    49: { id: 49, name: "Looking Below Desk", severity: "high", category: "Eye Tracking" },
    50: { id: 50, name: "Looking Toward Secondary Screen", severity: "high", category: "Eye Tracking" },
    51: { id: 51, name: "Looking Toward Mobile Device", severity: "high", category: "Eye Tracking" },
    52: { id: 52, name: "Multiple Voices Detected", severity: "high", category: "Audio" },
    53: { id: 53, name: "Continuous Conversation", severity: "critical", category: "Audio" },
    54: { id: 54, name: "Whispering Detected", severity: "medium", category: "Audio" },
    55: { id: 55, name: "Reading Questions Aloud", severity: "low", category: "Audio" },
    56: { id: 56, name: "Voice Assistance Detected", severity: "critical", category: "Audio" },
    57: { id: 57, name: "Audio Playback Detected", severity: "medium", category: "Audio" },
    58: { id: 58, name: "TV Noise Detected", severity: "low", category: "Audio" },
    59: { id: 59, name: "Call Audio Detected", severity: "high", category: "Audio" },
    60: { id: 60, name: "Headphone Microphone Conversation", severity: "high", category: "Audio" },
    61: { id: 61, name: "Mobile Phone Detected", severity: "high", category: "Object Detection" },
    62: { id: 62, name: "Tablet Detected", severity: "high", category: "Object Detection" },
    63: { id: 63, name: "Smartwatch Excessive Usage", severity: "medium", category: "Object Detection" },
    64: { id: 64, name: "Notebook Detected", severity: "medium", category: "Object Detection" },
    65: { id: 65, name: "Printed Notes Detected", severity: "high", category: "Object Detection" },
    66: { id: 66, name: "Book Detected", severity: "medium", category: "Object Detection" },
    67: { id: 67, name: "Calculator Detected", severity: "low", category: "Object Detection" },
    68: { id: 68, name: "Secondary Laptop Detected", severity: "high", category: "Object Detection" },
    69: { id: 69, name: "External Monitor Visible", severity: "high", category: "Object Detection" },
    70: { id: 70, name: "Earbuds Detected", severity: "high", category: "Object Detection" },
    71: { id: 71, name: "Bluetooth Device Detected", severity: "medium", category: "Object Detection" },
    72: { id: 72, name: "Copy Attempt", severity: "high", category: "Keyboard" },
    73: { id: 73, name: "Paste Attempt", severity: "high", category: "Keyboard" },
    74: { id: 74, name: "Cut Attempt", severity: "high", category: "Keyboard" },
    75: { id: 75, name: "Select All Attempt", severity: "medium", category: "Keyboard" },
    76: { id: 76, name: "Keyboard Macro Usage", severity: "critical", category: "Keyboard" },
    77: { id: 77, name: "Auto Typing Detected", severity: "critical", category: "Keyboard" },
    78: { id: 78, name: "Scripted Input Detected", severity: "critical", category: "Keyboard" },
    79: { id: 79, name: "Auto Answer Tool Usage", severity: "critical", category: "Keyboard" },
    80: { id: 80, name: "Right Click Attempt", severity: "medium", category: "Mouse" },
    81: { id: 81, name: "Context Menu Attempt", severity: "medium", category: "Mouse" },
    82: { id: 82, name: "Excessive Window Switching", severity: "high", category: "Mouse" },
    83: { id: 83, name: "Suspicious Cursor Movement", severity: "low", category: "Mouse" },
    84: { id: 84, name: "F12 Key Usage", severity: "critical", category: "Developer" },
    85: { id: 85, name: "Developer Tools Opened", severity: "critical", category: "Developer" },
    86: { id: 86, name: "Inspect Element Usage", severity: "critical", category: "Developer" },
    87: { id: 87, name: "Console Access Attempt", severity: "critical", category: "Developer" },
    88: { id: 88, name: "Source Code Inspection", severity: "critical", category: "Developer" },
    89: { id: 89, name: "Network Inspection", severity: "critical", category: "Developer" },
    90: { id: 90, name: "DOM Manipulation Attempt", severity: "critical", category: "Developer" },
    91: { id: 91, name: "ChatGPT Window Detected", severity: "critical", category: "AI Assistance" },
    92: { id: 92, name: "AI Tool Usage Detected", severity: "critical", category: "AI Assistance" },
    93: { id: 93, name: "Copilot Usage Detected", severity: "critical", category: "AI Assistance" },
    94: { id: 94, name: "Gemini Usage Detected", severity: "critical", category: "AI Assistance" },
    95: { id: 95, name: "Claude Usage Detected", severity: "critical", category: "AI Assistance" },
    96: { id: 96, name: "AI Generated Text Patterns", severity: "high", category: "AI Assistance" },
    97: { id: 97, name: "Automated Answer Generation", severity: "critical", category: "AI Assistance" },
    98: { id: 98, name: "VPN Detected", severity: "medium", category: "Network" },
    99: { id: 99, name: "Proxy Detected", severity: "medium", category: "Network" },
    100: { id: 100, name: "Frequent IP Changes", severity: "high", category: "Network" },
    101: { id: 101, name: "Multiple Concurrent Sessions", severity: "critical", category: "Network" },
    102: { id: 102, name: "Location Change During Test", severity: "high", category: "Network" },
    103: { id: 103, name: "Suspicious Network Activity", severity: "high", category: "Network" },
    104: { id: 104, name: "Multiple Login Sessions", severity: "critical", category: "Account" },
    105: { id: 105, name: "Account Sharing Suspicion", severity: "high", category: "Account" },
    106: { id: 106, name: "Simultaneous Device Login", severity: "critical", category: "Account" },
    107: { id: 107, name: "Candidate Identity Mismatch", severity: "critical", category: "Account" },
    108: { id: 108, name: "Extremely Fast Answering", severity: "medium", category: "Assessment Behavior" },
    109: { id: 109, name: "Extremely Slow Suspicious Pattern", severity: "low", category: "Assessment Behavior" },
    110: { id: 110, name: "Random Guessing Pattern", severity: "medium", category: "Assessment Behavior" },
    111: { id: 111, name: "Identical Answers Pattern", severity: "high", category: "Assessment Behavior" },
    112: { id: 112, name: "Question Skipping Abuse", severity: "low", category: "Assessment Behavior" },
    113: { id: 113, name: "Repeated Answer Changes", severity: "low", category: "Assessment Behavior" },
    114: { id: 114, name: "Unusual Accuracy Spike", severity: "high", category: "Assessment Behavior" },
    115: { id: 115, name: "Suspicious Score Pattern", severity: "medium", category: "Assessment Behavior" },
    116: { id: 116, name: "OBS Detected", severity: "critical", category: "Screen Recording" },
    117: { id: 117, name: "Screen Recorder Detected", severity: "critical", category: "Screen Recording" },
    118: { id: 118, name: "Bandicam Detected", severity: "critical", category: "Screen Recording" },
    119: { id: 119, name: "Loom Detected", severity: "critical", category: "Screen Recording" },
    120: { id: 120, name: "Screen Capture Running", severity: "critical", category: "Screen Recording" }
  };

  const getSeverityDeduction = (severity) => {
    switch (severity) {
      case 'low': return 2;
      case 'medium': return 5;
      case 'high': return 10;
      case 'critical': return 25;
      default: return 0;
    }
  };

  const captureScreenshot = () => {
    if (videoRef.current && streamActive) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.6);
        }
      } catch (err) {
        console.error('Error capturing screenshot:', err);
      }
    }
    return null;
  };

  const triggerViolation = (violationId, customDescription = '') => {
    if (!isProctoringReady.current) {
      console.log("Skipping violation during initialization phase:", violationId, customDescription);
      return;
    }
    const v = VIOLATIONS_REGISTRY[violationId];
    if (!v) return;

    const timestamp = new Date().toLocaleTimeString();
    const desc = customDescription || `Detected violation: ${v.name}`;
    
    // Deduct trust score
    const deduction = getSeverityDeduction(v.severity);
    setTrustScore(t => {
      const nextScore = Math.max(0, t - deduction);
      if (nextScore < 20) {
        setTimeout(() => forceSubmit("Trust score fell below 20%"), 300);
      }
      return nextScore;
    });

    // Track severity counts
    if (v.severity === 'high') {
      setHighSeverityCount(c => c + 1);
    } else if (v.severity === 'critical') {
      setCriticalSeverityCount(c => c + 1);
    }

    if (violationId === 61) { // Mobile Phone Detected
      setPhoneDetectionCount(c => {
        const next = c + 1;
        if (next >= 2) setTimeout(() => forceSubmit("Mobile Phone Detected Multiple Times"), 300);
        return next;
      });
    }

    // Bounding Box Overlay for UI
    if (['Webcam', 'Head Movement', 'Eye Tracking', 'Object Detection'].includes(v.category)) {
      const label = `${v.name} (${v.severity.toUpperCase()})`;
      setActiveBox({
        label,
        top: 15 + Math.random() * 25,
        left: 15 + Math.random() * 25,
        width: 40 + Math.random() * 20,
        height: 40 + Math.random() * 20,
        borderColor: v.severity === 'critical' || v.severity === 'high' ? 'border-red-500 text-red-500' : 'border-amber-500 text-amber-500'
      });
      setTimeout(() => setActiveBox(null), 3000);

      // Snap screenshot
      setTimeout(() => {
        const snap = captureScreenshot();
        if (snap) {
          setScreenshots(prev => [...prev.slice(-9), snap]);
        }
      }, 100);
    }

    if (v.severity === 'high' || v.severity === 'critical') {
      setWarnings(w => {
        const next = w + 1;
        if (next >= 3) {
          setTimeout(() => {
            forceSubmit("Auto Submission Due To Violations");
          }, 100);
        }
        return next;
      });
    }

    const logEntry = { timestamp, event: v.name, severity: v.severity };
    if (['Browser', 'System', 'Keyboard', 'Mouse', 'Developer', 'Screen Recording'].includes(v.category)) {
      setScreenActivityLog(prev => [...prev, logEntry]);
    } else if (v.category === 'Audio') {
      setAudioActivityLog(prev => [...prev, logEntry]);
    } else if (v.category === 'Object Detection') {
      setObjectDetectionLog(prev => [...prev, logEntry]);
    } else {
      setScreenActivityLog(prev => [...prev, logEntry]);
    }

    setViolationTimeline(prev => [...prev, {
      timestamp,
      type: v.name,
      description: desc,
      severity: v.severity,
      questionIndex: currentQuestion
    }]);

    toast.error(`ALERT: ${v.name}`, {
      duration: 3000,
      style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: 'bold' }
    });

    // Auto submit rules
    if (violationId === 85) setTimeout(() => forceSubmit("Developer Tools Opened"), 300);
    if (violationId === 24) setTimeout(() => forceSubmit("Screen Sharing Detected"), 300);
    if (violationId === 20) setTimeout(() => forceSubmit("Remote Desktop Detected"), 300);
    if (violationId === 92) setTimeout(() => forceSubmit("AI Assistance Detected"), 300);
    if (violationId === 34) setTimeout(() => forceSubmit("Camera Disabled"), 300);
    if (violationId === 107) setTimeout(() => forceSubmit("Identity Mismatch"), 300);
  };

  useEffect(() => {
    if (activeQuiz && !showResult) {
      isProctoringReady.current = false;
      const timer = setTimeout(() => {
        isProctoringReady.current = true;
        console.log("Proctoring is now active and ready.");
      }, 3000);
      return () => {
        clearTimeout(timer);
        isProctoringReady.current = false;
      };
    }
  }, [activeQuiz, showResult]);

  useEffect(() => {
    if (!activeQuiz || !attemptId || showResult) return;

    // Enter Fullscreen
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    };
    enterFullscreen();

    // Timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          forceSubmit("Time Limit Reached");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Visibility switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(1, "Excessive Tab Switching: Hidden window state.");
      } else {
        triggerViolation(3, "Browser Hidden Behind Other Windows: Refocused.");
      }
    };

    // Fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        triggerViolation(2, "Browser Minimized: Exited fullscreen.");
      }
    };

    // Right Click context menu blocker
    const preventDefault = (e) => {
      e.preventDefault();
      triggerViolation(80, "Right Click Attempt: Blocked context menu.");
      triggerViolation(81, "Context Menu Attempt: Blocked context menu.");
    };

    // Keyboard blockers
    const handleKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation(84, "F12 Key Usage");
        triggerViolation(85, "Developer Tools Opened");
        return;
      }

      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') || (e.metaKey && e.altKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        triggerViolation(86, "Inspect Element Usage");
        triggerViolation(85, "Developer Tools Opened");
        return;
      }

      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j') || (e.metaKey && e.altKey && e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        triggerViolation(87, "Console Access Attempt");
        triggerViolation(85, "Developer Tools Opened");
        return;
      }

      if ((e.ctrlKey && e.key.toLowerCase() === 'u') || (e.metaKey && e.altKey && e.key.toLowerCase() === 'u')) {
        e.preventDefault();
        triggerViolation(88, "Source Code Inspection");
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          triggerViolation(72, "Copy Attempt");
        }
        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          triggerViolation(73, "Paste Attempt");
        }
        if (e.key.toLowerCase() === 'x') {
          e.preventDefault();
          triggerViolation(74, "Cut Attempt");
        }
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          triggerViolation(75, "Select All Attempt");
        }
      }
    };

    // Zoom/Resolution checks
    const handleResize = () => {
      const ratio = window.outerWidth / window.innerWidth;
      if (Math.abs(ratio - 1) > 0.08) {
        triggerViolation(13, "Browser Zoom Manipulation");
      }
      triggerViolation(18, "Screen Resolution Changed");
    };

    // Webcam/Mic proctoring is deactivated
    console.log("Proctoring webcam and mic are deactivated.");

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (document.fullscreenElement) document.exitFullscreen().catch(e => console.log(e));
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error("Error stopping media recorder in cleanup:", e);
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setProctorStream(null);
    };
  }, [activeQuiz, attemptId, showResult]);

  // Real AI Proctoring Evaluation Loop
  useEffect(() => {
    if (!activeQuiz || !attemptId || showResult || !streamActive) return;

    const loadProctoringModels = async () => {
      try {
        if (window.faceapi) {
          const MODEL_URL = '/models';
          if (!window.faceapi.nets.ssdMobilenetv1.params) {
            await window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
          }
          if (!window.faceapi.nets.faceLandmark68Net.params) {
            await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          }
          if (!window.faceapi.nets.faceRecognitionNet.params) {
            await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
          }
        }
      } catch (err) {
        console.error("Error loading face-api models for proctoring:", err);
      }
    };
    loadProctoringModels();

    // Make sure we fetch the face profile for matching during the quiz
    const fetchRegisteredEmbedding = async () => {
      if (!registeredFaceEmbedding) {
        const savedUserStr = localStorage.getItem('user');
        let savedUser = null;
        try {
          savedUser = savedUserStr && savedUserStr !== 'undefined' ? JSON.parse(savedUserStr) : null;
        } catch (e) {
          console.error("Failed to parse user in loadProctoringModels:", e);
        }
        const currentUserId = user?.id || user?._id || savedUser?.id || savedUser?._id;
        if (currentUserId) {
          try {
            console.log("[FaceAPI] Fetching registered facial embedding for user during proctoring:", currentUserId);
            const faceRes = await axios.get(`${API_URL}/auth/users/${currentUserId}/face-descriptor`);
            if (faceRes.data && faceRes.data.facialEmbedding) {
              setRegisteredFaceEmbedding(faceRes.data.facialEmbedding);
              console.log("[FaceAPI] Registered facial embedding loaded successfully for proctoring");
            }
          } catch (e) {
            console.error("Failed to fetch registered embedding:", e);
          }
        }
      }
    };
    fetchRegisteredEmbedding();

    const proctorInterval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const faceapi = window.faceapi;
        if (!faceapi || !faceapi.nets.ssdMobilenetv1.params || !faceapi.nets.faceRecognitionNet.params) return;

        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
        ).withFaceLandmarks().withFaceDescriptors();

        if (detections.length === 0) {
          consecutiveNoFaceCount.current += 1;
          consecutiveMultipleFacesCount.current = 0;
          consecutiveLookingAwayCount.current = 0;
          consecutiveIdentityMismatchCount.current = 0;

          if (consecutiveNoFaceCount.current >= 5) { // 25 seconds of continuous absence
            triggerViolation(27, "Face Not Visible: No face detected in webcam frame for 25s.");
            consecutiveNoFaceCount.current = 0;
          }
        } else if (detections.length > 1) {
          consecutiveMultipleFacesCount.current += 1;
          consecutiveNoFaceCount.current = 0;
          consecutiveLookingAwayCount.current = 0;
          consecutiveIdentityMismatchCount.current = 0;

          if (consecutiveMultipleFacesCount.current >= 3) { // 15 seconds of continuous presence
            triggerViolation(29, "Multiple Faces Detected: More than one face present in camera view for 15s.");
            consecutiveMultipleFacesCount.current = 0;
          }
        } else {
          consecutiveNoFaceCount.current = 0;
          consecutiveMultipleFacesCount.current = 0;

          // 1. Verify candidate identity matches the registered face profile
          if (registeredFaceEmbedding && detections[0].descriptor) {
            const currentDescriptor = Array.from(detections[0].descriptor);
            const distance = faceapi.euclideanDistance(currentDescriptor, registeredFaceEmbedding);
            console.log(`[FaceAPI Proctoring] Identity Distance: ${distance.toFixed(4)}`);
            
            if (distance > 0.6) {
              consecutiveIdentityMismatchCount.current += 1;
              if (consecutiveIdentityMismatchCount.current >= 3) { // 15 seconds of continuous mismatch
                triggerViolation(107, "Identity Mismatch: Candidate face does not match the registered user profile.");
                consecutiveIdentityMismatchCount.current = 0;
              }
            } else {
              consecutiveIdentityMismatchCount.current = 0;
            }
          }

          // 2. Gaze detection
          const landmarks = detections[0].landmarks.positions;
          const jaw = landmarks.slice(0, 17);
          const noseTip = landmarks[30];

          const noseRatio = (noseTip.x - jaw[0].x) / (jaw[16].x - noseTip.x);
          
          if (noseRatio < 0.6 || noseRatio > 1.6) {
            consecutiveLookingAwayCount.current += 1;
            if (consecutiveLookingAwayCount.current >= 6) { // 30 seconds of continuous gaze shift
              const direction = noseRatio < 0.6 ? "left" : "right";
              triggerViolation(
                noseRatio < 0.6 ? 38 : 39,
                `Looking Away: Continuous gaze shift to the ${direction} for 30s.`
              );
              consecutiveLookingAwayCount.current = 0;
            }
          } else {
            consecutiveLookingAwayCount.current = 0;
          }
        }
      } catch (err) {
        console.error("Error running active background proctoring:", err);
      }
    }, 5000);

    return () => clearInterval(proctorInterval);
  }, [activeQuiz, attemptId, showResult, streamActive, registeredFaceEmbedding]);

  const forceSubmit = (reason = 'Security Policy Violation') => {
    if (showResult) return;
    setAutoSubmitReasonState(reason);
    setShowResult(true);
    submitScore(true, reason);
    if (document.fullscreenElement) document.exitFullscreen().catch(e => console.log(e));
  };

  const handleOptionSelect = (option) => {
    setUserAnswers({ ...userAnswers, [currentQuestion]: option });
  };

  const handleSaveAndNext = () => {
    const newStatus = { ...questionStatus };
    if (userAnswers[currentQuestion]) {
      newStatus[currentQuestion] = 'answered';
    } else {
      newStatus[currentQuestion] = 'visited';
    }
    setQuestionStatus(newStatus);
    
    if (currentQuestion + 1 < activeQuiz.quiz.length) {
      setCurrentQuestion(currentQuestion + 1);
      if (newStatus[currentQuestion + 1] === 'not_visited') {
        setQuestionStatus({ ...newStatus, [currentQuestion + 1]: 'visited' });
      }
    }
  };

  const handleMarkForReview = () => {
    setQuestionStatus({ ...questionStatus, [currentQuestion]: 'marked' });
    if (currentQuestion + 1 < activeQuiz.quiz.length) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const jumpToQuestion = (index) => {
    const newStatus = { ...questionStatus };
    if (newStatus[currentQuestion] === 'not_visited' || newStatus[currentQuestion] === 'visited') {
       if (userAnswers[currentQuestion]) newStatus[currentQuestion] = 'answered';
       else newStatus[currentQuestion] = 'visited';
    }
    if (newStatus[index] === 'not_visited') newStatus[index] = 'visited';
    setQuestionStatus(newStatus);
    setCurrentQuestion(index);
  };

  const uploadProctoringVideo = () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      
      const finalizeUpload = async (blob) => {
        if (!blob || blob.size === 0) {
          resolve('');
          return;
        }
        try {
          const mimeType = (recorder && recorder.mimeType) || blob.type || 'video/webm';
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const formData = new FormData();
          formData.append('video', blob, `proctored-${attemptId}-${Date.now()}.${extension}`);
          const res = await axios.post(`${API_URL}/videos/upload-proctoring`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          resolve(res.data.videoRecordingUrl || '');
        } catch (err) {
          console.error("Failed to upload proctoring video:", err);
          resolve('');
        }
      };

      if (!recorder || recorder.state === 'inactive') {
        if (chunksRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type || 'video/webm' });
          finalizeUpload(blob);
        } else {
          resolve('');
        }
        return;
      }

      recorder.onstop = () => {
        if (chunksRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type || 'video/webm' });
          finalizeUpload(blob);
        } else {
          resolve('');
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.error("Error stopping recorder on upload:", err);
        if (chunksRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type || 'video/webm' });
          finalizeUpload(blob);
        } else {
          resolve('');
        }
      }
    });
  };

  const submitScore = async (forced = false, forcedReason = '') => {
    let videoUrl = '';
    try {
      videoUrl = await uploadProctoringVideo();
    } catch (e) {
      console.error("Failed to upload proctoring video:", e);
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.error("Error stopping media stream tracks:", e);
      }
      mediaStreamRef.current = null;
      setProctorStream(null);
    }
    setStreamActive(false);

    let submissionType = 'Normal Submission';
    if (forced) {
      if (forcedReason === 'Time Limit Reached') {
        submissionType = 'Time Expired Submission';
      } else {
        submissionType = 'Auto Submission Due To Violations';
      }
    }
    setSubmissionTypeState(submissionType);

    try {
      const duration = 1800 - timeLeft;
      const answersList = activeQuiz.quiz.map((q, i) => {
        const selectedOption = userAnswers[i];
        return {
          questionIndex: i,
          candidateAnswer: selectedOption !== undefined && selectedOption !== null ? selectedOption : '',
          timeTaken: Math.floor(duration / activeQuiz.quiz.length) || 10,
          violationCountDuringQuestion: violationTimeline.filter(vt => vt.questionIndex === i).length
        };
      });

      const aiSuspicionScore = Math.max(0, 100 - trustScore);

      const isCourse = !activeQuiz.isStandalone;
      const response = await axios.post(`${API_URL}/quizzes/submit`, {
        userId: user.id || user._id,
        attemptId,
        courseId: isCourse ? activeQuiz._id : undefined,
        quizId: !isCourse ? activeQuiz._id : undefined,
        lessonIndex: activeQuiz.lessonIndex,
        duration,
        trustScore,
        warnings,
        violationTimeline: violationTimeline.slice(0, 20),
        answers: answersList,
        videoRecordingUrl: videoUrl,
        autoSubmitReason: forced ? (forcedReason || 'Auto-submitted due to violations') : '',
        screenshots: screenshots.slice(0, 3),
        screenActivityLog: screenActivityLog.slice(0, 10),
        audioActivityLog: audioActivityLog.slice(0, 10),
        objectDetectionLog: objectDetectionLog.slice(0, 10),
        aiSuspicionScore,
        submissionType
      });

      // Clear local storage progress upon successful submission
      localStorage.removeItem('quiz_current_question');
      localStorage.removeItem('quiz_user_answers');
      localStorage.removeItem('active_quiz_meta');

      setSubmissionResult(response.data);
      setScore(response.data.score);
      setShowResult(true);
      fetchUserAttempts();
      toast.success(forced ? `Assessment Auto-Submitted: ${forcedReason}` : 'Assessment Submitted Successfully!');
    } catch (error) {
      console.error('Failed to save score', error);
      toast.error('Failed to submit assessment evaluation.');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setAttemptId(null);
    localStorage.removeItem('active_quiz_meta');
    localStorage.removeItem('quiz_current_question');
    localStorage.removeItem('quiz_user_answers');
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setUserAnswers({});
    setWarnings(0);
    setSubmissionResult(null);
  };

  if (activeQuiz) {
    // Pre-assessment Face Verification modal checks removed

    if (attemptLoading || !attemptId || !activeQuiz.quiz || !activeQuiz.quiz[currentQuestion]) {
      return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center font-sans text-white">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Initializing Secure Exam Session...</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Restoring attempt details and verifying question integrity.</p>
        </div>
      );
    }
    const q = activeQuiz.quiz[currentQuestion];
    
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col font-sans overflow-hidden select-none">
        {/* Unstop Style Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Award className="text-primary" /> {activeQuiz.title}
            </h1>
            <span className="px-3 py-1 bg-red-50 text-red-600 font-bold text-[10px] uppercase tracking-widest rounded-full border border-red-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Proctoring Active
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <span className={`text-xs font-bold px-3 py-1 rounded-md border ${warnings > 0 ? 'text-red-500 bg-red-50 border-red-100' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
              Warnings: {warnings}/3
            </span>
            <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-mono font-bold text-lg shadow-inner">
              <Clock size={18} className={timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-cyan-400'} />
              <span className={timeLeft < 300 ? 'text-red-400' : ''}>{formatTime(timeLeft)}</span>
            </div>
            {!showResult && (
              <button 
                onClick={() => { setShowResult(true); submitScore(); }}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wide shadow-md shadow-red-500/20"
              >
                Submit Exam
              </button>
            )}
          </div>
        </header>

        {!showResult ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Main Content */}
            <div className="flex-1 flex flex-col bg-slate-50 relative">
              {/* Question Area */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-32">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Question {currentQuestion + 1}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span>Multiple Choice</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>+1 Marks</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>-0.25 Marks</span>
                    </div>
                  </div>

                  {(() => {
                    const questionText = q?.question || q?.questionText || q?.text || q?.title || q?.content || "";
                    return questionText ? (
                      <h2 className="text-2xl font-bold text-slate-900 mb-6 leading-relaxed whitespace-pre-wrap break-words">
                        {questionText}
                      </h2>
                    ) : (
                      <div className="text-red-500 font-semibold mb-6">
                        Question data unavailable
                      </div>
                    );
                  })()}

                  {q.questionType === 'text' ? (
                    <div className="space-y-2 max-w-2xl">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Your Answer</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-primary transition-all font-bold text-lg text-slate-800"
                        placeholder="Type your answer here..."
                        value={userAnswers[currentQuestion] || ''}
                        onChange={(e) => setUserAnswers({ ...userAnswers, [currentQuestion]: e.target.value })}
                      />
                    </div>
                  ) : q.questionType === 'multiple' ? (
                    <div className="space-y-4">
                      {q.options && q.options.map((option, i) => {
                        const currentSelections = userAnswers[currentQuestion] || [];
                        const isSelected = currentSelections.includes(option);
                        
                        const handleMultipleSelect = () => {
                          let nextSelections;
                          if (isSelected) {
                            nextSelections = currentSelections.filter(item => item !== option);
                          } else {
                            nextSelections = [...currentSelections, option];
                          }
                          setUserAnswers({ ...userAnswers, [currentQuestion]: nextSelections });
                        };

                        return (
                          <div 
                            key={i}
                            onClick={handleMultipleSelect}
                            className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.1)]' 
                                : 'border-slate-200 bg-white hover:border-primary/40'
                            }`}
                          >
                            <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="text-[10px] font-black">✓</div>}
                            </div>
                            <span className="text-lg font-medium text-slate-700">{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {q.options && q.options.map((option, i) => {
                        const isSelected = userAnswers[currentQuestion] === option;
                        return (
                          <div 
                            key={i}
                            onClick={() => handleOptionSelect(option)}
                            className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.1)]' 
                                : 'border-slate-200 bg-white hover:border-primary/40'
                            }`}
                          >
                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-primary' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                            </div>
                            <span className="text-lg font-medium text-slate-700">{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 px-8 flex items-center justify-between z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                <div className="flex gap-4">
                  <button 
                    onClick={handleMarkForReview}
                    className="px-6 py-3 bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2"
                  >
                    <Star size={18} /> Mark for Review & Next
                  </button>
                  <button 
                    onClick={() => {
                      const newStatus = { ...questionStatus };
                      newStatus[currentQuestion] = 'not_visited';
                      setQuestionStatus(newStatus);
                      const newAns = {...userAnswers};
                      delete newAns[currentQuestion];
                      setUserAnswers(newAns);
                    }}
                    className="px-6 py-3 bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Clear Response
                  </button>
                </div>
                
                <button 
                  onClick={handleSaveAndNext}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                >
                  Save & Next <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Right Question Palette */}
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-20">
              
              {/* Webcam Proctoring */}
              <div className="p-4 border-b border-slate-100 bg-slate-900 relative">
                <div className="w-full h-32 rounded-lg border border-slate-700 bg-black overflow-hidden relative shadow-inner">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                  
                  {/* Real-time Bounding Box Overlays */}
                  {activeBox && (
                    <div 
                      className={`absolute border-2 ${activeBox.borderColor} pointer-events-none rounded flex flex-col justify-between`}
                      style={{
                        top: `${activeBox.top}%`,
                        left: `${activeBox.left}%`,
                        width: `${activeBox.width}%`,
                        height: `${activeBox.height}%`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span className="bg-black/80 text-[8px] font-black text-white px-1 py-0.5 rounded-br w-max truncate max-w-full">
                        {activeBox.label}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full ${streamActive ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-500'}`}><Video size={10}/></span>
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full ${streamActive ? 'bg-green-500/20 text-green-500 animate-pulse' : 'bg-slate-800 text-slate-500'}`}><Mic size={10}/></span>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] text-white font-black uppercase bg-black/60 backdrop-blur-md px-2 py-1 rounded shadow-md border border-white/10">
                    <ShieldAlert size={10} className={trustScore > 70 ? 'text-blue-400' : trustScore > 40 ? 'text-yellow-400' : 'text-red-500'} /> 
                    Trust: <span className={trustScore > 70 ? 'text-blue-400' : trustScore > 40 ? 'text-yellow-400' : 'text-red-500'}>{trustScore}%</span>
                  </div>
                </div>
              </div>

              {/* Profile Card Mini */}
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                <img src={user?.profilePicture || 'https://via.placeholder.com/40'} alt="User" className="w-10 h-10 rounded-full border border-slate-200" />
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-800 truncate text-sm">{user?.name || 'Candidate'}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate ID: {user?._id?.substring(0, 8)}</p>
                </div>
              </div>

              {/* Palette Stats */}
              <div className="p-4 border-b border-slate-100 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-md"></div> Answered ({Object.values(questionStatus).filter(s => s === 'answered').length})</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-md"></div> Not Answered ({Object.values(questionStatus).filter(s => s === 'visited').length})</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-200 rounded-md"></div> Not Visited ({Object.values(questionStatus).filter(s => s === 'not_visited').length})</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-500 rounded-md flex items-center justify-center text-white"><Star size={10} /></div> Marked ({Object.values(questionStatus).filter(s => s === 'marked').length})</div>
              </div>

              {/* Grid */}
              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Question Palette</h3>
                <div className="grid grid-cols-5 gap-3">
                  {activeQuiz.quiz.map((_, i) => {
                    let bgColor = 'bg-slate-100 text-slate-600 border-slate-200';
                    const status = questionStatus[i];
                    
                    if (status === 'answered') bgColor = 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20';
                    else if (status === 'visited') bgColor = 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20';
                    else if (status === 'marked') bgColor = 'bg-purple-500 text-white border-purple-600 shadow-md shadow-purple-500/20';

                    return (
                      <button
                        key={i}
                        onClick={() => jumpToQuestion(i)}
                        className={`w-full aspect-square rounded-lg border font-bold text-sm flex items-center justify-center transition-all ${bgColor} ${currentQuestion === i ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 z-10' : 'hover:scale-105'}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-12 max-w-3xl w-full rounded-[40px] shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-green-500 w-12 h-12" />
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Assessment Complete</h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-xs mb-10">Smart Analytics Report Generated</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {(() => {
                  const totalQuestions = submissionResult ? submissionResult.totalQuestions : activeQuiz.quiz.length;
                  const scoreValue = submissionResult ? submissionResult.score : 0;
                  const correctCount = submissionResult ? submissionResult.correctCount : 0;
                  const wrongCount = submissionResult ? submissionResult.wrongCount : 0;
                  const notAttemptedCount = submissionResult ? submissionResult.notAttemptedCount : 0;
                  const percentage = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : 0;
                  const violationCount = violationTimeline.length;

                  return (
                    <>
                      {/* Performance Summary Cards */}
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <p className="text-4xl font-black text-emerald-500 tracking-tighter">{correctCount}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Correct Answers</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <p className="text-4xl font-black text-red-500 tracking-tighter">{wrongCount}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Wrong Answers</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <p className="text-4xl font-black text-slate-500 tracking-tighter">{notAttemptedCount}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Not Attempted</p>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <p className="text-4xl font-black text-primary tracking-tighter">{scoreValue} / {totalQuestions}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Score</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <p className="text-4xl font-black text-blue-600 tracking-tighter">{percentage}%</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Percentage</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <p className="text-4xl font-black text-orange-500 tracking-tighter">{violationCount}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Violation Count</p>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <p className="text-4xl font-black text-red-500 tracking-tighter">{warnings} / 3</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Warning Count</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center col-span-1 md:col-span-2 flex flex-col justify-center items-center">
                        <p className={`text-2xl font-black tracking-tighter ${trustScore > 70 ? 'text-emerald-500' : trustScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                          {trustScore}% ({trustScore > 70 ? 'EXCELLENT TRUST' : trustScore > 40 ? 'MODERATE RISK' : 'CRITICAL WARNING'})
                        </p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Trust Score</p>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-3 flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Submission Type</p>
                          <p className={`text-lg font-black uppercase tracking-tighter mt-1 ${
                            submissionTypeState === 'Auto Submission Due To Violations'
                              ? 'text-red-600'
                              : submissionTypeState === 'Time Expired Submission'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}>
                            {submissionTypeState}
                          </p>
                        </div>
                        {autoSubmitReasonState && (
                          <div className="text-right text-xs text-red-700 font-semibold bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                            Reason: "{autoSubmitReasonState}"
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex gap-4 justify-center">
                {submissionResult && (
                  <button
                    onClick={() => setSelectedAttempt(submissionResult)}
                    className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20"
                  >
                    Review Questions
                  </button>
                )}
                <button
                  onClick={resetQuiz}
                  className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/20"
                >
                  Exit Exam Portal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="mb-12">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Skill Assessments</h2>
        <p className="text-slate-500 mt-1 font-medium tracking-tight">Prove your green expertise and claim your spot on the leaderboard.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Middle: Available Quizzes list */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Available Course Assessments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {courses.map((course, i) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/55 flex flex-col transition-all duration-500"
                  >
                    {/* Premium Top Accent */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-900 via-primary to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"></div>
                    
                    {/* Cover Banner */}
                    <div className="h-44 relative overflow-hidden bg-slate-100">
                      <img src={course.coverImage || course.thumbnail} className="w-full h-full object-cover mix-blend-multiply opacity-80 transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                      
                      {/* Security Badge */}
                      <div className="absolute top-5 left-5 flex gap-2 z-10">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md border border-red-100 text-red-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Proctored Exam
                        </span>
                      </div>
                    </div>

                    <div className="px-8 pb-8 flex-1 flex flex-col relative z-10 -mt-6">
                      <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl mb-5 flex items-center justify-center text-slate-900 shadow-lg group-hover:-translate-y-2 transition-transform duration-500 relative z-20">
                         <ShieldAlert size={24} strokeWidth={1.5} />
                      </div>
                      
                      <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight leading-tight">{course.title}</h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 line-clamp-2">{course.description}</p>

                      <div className="flex items-center justify-between gap-2 mb-8 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex-1 text-center py-2">
                          <p className="text-slate-900 font-black text-lg">{course.quiz.length}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Questions</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex-1 text-center py-2">
                          <p className="text-slate-900 font-black text-lg">30m</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Duration</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex-1 text-center py-2">
                          <p className="text-primary font-black text-lg">Strict</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Integrity</p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <button
                          onClick={() => setActiveQuiz(course)}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-300 shadow-lg shadow-slate-900/20 group/btn"
                        >
                          Enter Exam Portal
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {employerQuizzes.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Direct Employer Hiring Exams</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {employerQuizzes.map((quiz, i) => (
                    <motion.div
                      key={quiz._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -8 }}
                      className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/55 flex flex-col transition-all duration-500"
                    >
                      {/* Premium Top Accent */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"></div>
                      
                      {/* Cover Banner */}
                      <div className="h-44 relative overflow-hidden bg-slate-100">
                        {/* Beautiful generic green graphic background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-950 opacity-90 transition-transform duration-700 group-hover:scale-105 animate-pulse duration-[10000ms]"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
                        
                        {/* Security Badge */}
                        <div className="absolute top-5 left-5 flex gap-2 z-10">
                          <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Employer Custom
                          </span>
                        </div>
                      </div>

                      <div className="px-8 pb-8 flex-1 flex flex-col relative z-10 -mt-6">
                        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl mb-5 flex items-center justify-center text-slate-900 shadow-lg group-hover:-translate-y-2 transition-transform duration-500 relative z-20">
                           <Award size={24} className="text-emerald-500" strokeWidth={1.5} />
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight leading-tight">{quiz.title}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                          Created by: {quiz.createdBy?.companyName || quiz.createdBy?.name || 'Recruitment Team'}
                        </p>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 line-clamp-2">{quiz.description || 'Custom skills verification challenge for hiring pipelines.'}</p>

                        <div className="flex items-center justify-between gap-2 mb-8 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex-1 text-center py-2">
                            <p className="text-slate-900 font-black text-lg">{quiz.questions?.length || 0}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Questions</p>
                          </div>
                          <div className="w-px h-8 bg-slate-200"></div>
                          <div className="flex-1 text-center py-2">
                            <p className="text-slate-900 font-black text-lg">{quiz.duration || 15}m</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Duration</p>
                          </div>
                          <div className="w-px h-8 bg-slate-200"></div>
                          <div className="flex-1 text-center py-2">
                            <p className="text-emerald-500 font-black text-lg">{quiz.category || 'General'}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Category</p>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <button
                            onClick={() => setActiveQuiz(quiz)}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 shadow-lg shadow-emerald-600/20"
                          >
                            Enter Exam Portal
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Attempt history */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Attempt History & Reports</h3>
            
            {attempts.length > 0 ? (
              <div className="space-y-4">
                {attempts.map((attempt) => {
                  const attemptTrust = attempt.trustScore !== undefined ? attempt.trustScore : 100;
                  
                  return (
                    <motion.div 
                      key={attempt._id} 
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-md flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            attempt.isInvalidated
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : attempt.status === 'Pass' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {attempt.isInvalidated ? 'Invalidated' : (attempt.status || 'Fail')}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono font-medium">
                            {new Date(attempt.completedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{attempt.course?.title || 'Solar PV Assessment'}</h4>
                        
                        <div className="grid grid-cols-2 gap-2 py-2 text-[10px] uppercase font-bold text-slate-500">
                          <div>
                            <span className="block text-slate-400 text-[8px] font-black">Score</span>
                            <span className={`font-black text-sm ${attempt.isInvalidated ? 'text-red-600 line-through' : 'text-slate-800'}`}>
                              {attempt.isInvalidated ? '0%' : `${attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0}%`}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[8px] font-black">Trust Score</span>
                            <span className={`font-black text-sm ${
                              attemptTrust > 75 ? 'text-emerald-500' : attemptTrust > 40 ? 'text-amber-500' : 'text-red-500'
                            }`}>{attemptTrust}%</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedAttempt(attempt)}
                        className="mt-4 w-full py-2.5 bg-slate-900 hover:bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors"
                      >
                        View Integrity Report
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 text-center shadow-md">
                <ShieldAlert size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 text-xs uppercase tracking-tight">No attempts registered yet</p>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Once you enter the proctored exam portal and submit your answers, your score and detailed AI integrity audit logs will display here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attempt Details Modal */}
      <AnimatePresence>
        {selectedAttempt && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-50 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-white p-6 px-8 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Assessment Audit Report</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {selectedAttempt.course?.title || 'Solar panel certification'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedAttempt(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Modal Scroll Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Auto submit details */}
                {selectedAttempt.autoSubmitReason && (
                  <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-3">
                    <ShieldAlert className="text-red-500 shrink-0" size={20} />
                    <p className="text-xs text-red-900 font-medium leading-relaxed">
                      This assessment was automatically submitted because of a critical integrity violation: 
                      <strong className="text-red-950 ml-1">"{selectedAttempt.autoSubmitReason}"</strong>.
                    </p>
                  </div>
                )}

                 {/* Score Summary cards */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                       selectedAttempt.status === 'Pass' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                     }`}>{selectedAttempt.status || 'Fail'}</span>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Score Card</span>
                     <span className="text-slate-900 font-black text-lg">{selectedAttempt.score || 0} / {selectedAttempt.totalQuestions || 0}</span>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Percentage</span>
                     <span className="text-slate-900 font-black text-lg">{selectedAttempt.totalQuestions ? Math.round((selectedAttempt.score / selectedAttempt.totalQuestions) * 100) : 0}%</span>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Warnings</span>
                     <span className="text-slate-900 font-black text-lg">{selectedAttempt.warnings || 0} Flags</span>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Correct Answers</span>
                     <span className="text-emerald-600 font-black text-lg">{selectedAttempt.correctCount !== undefined ? selectedAttempt.correctCount : selectedAttempt.score}</span>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Wrong Answers</span>
                     <span className="text-red-500 font-black text-lg">{selectedAttempt.wrongCount !== undefined ? selectedAttempt.wrongCount : 0}</span>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Not Attempted</span>
                     <span className="text-slate-500 font-black text-lg">{selectedAttempt.notAttemptedCount !== undefined ? selectedAttempt.notAttemptedCount : 0}</span>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Trust Profile</span>
                     <span className={`font-black text-lg ${
                       (selectedAttempt.trustScore !== undefined ? selectedAttempt.trustScore : 100) > 75 ? 'text-emerald-500' : (selectedAttempt.trustScore !== undefined ? selectedAttempt.trustScore : 100) > 40 ? 'text-amber-500' : 'text-red-500'
                     }`}>{selectedAttempt.trustScore !== undefined ? selectedAttempt.trustScore : 100}%</span>
                   </div>
                 </div>

                 {/* Submission Type Card */}
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                   <div>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Submission Type</span>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                       selectedAttempt.submissionType === 'Auto Submission Due To Violations'
                         ? 'bg-red-50 text-red-600 border border-red-100'
                         : selectedAttempt.submissionType === 'Time Expired Submission'
                         ? 'bg-amber-50 text-amber-600 border border-amber-100'
                         : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                     }`}>{selectedAttempt.submissionType || 'Normal Submission'}</span>
                   </div>
                   <div>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 text-right">Violation Count</span>
                     <span className="text-slate-900 font-black text-sm block text-right">{selectedAttempt.violationTimeline?.length || 0} Triggers</span>
                   </div>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Screenshots grid */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Webcam Screenshots</h4>
                    {selectedAttempt.screenshots && selectedAttempt.screenshots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedAttempt.screenshots.map((src, idx) => (
                          <div key={idx} className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                            <img src={src} className="w-full h-full object-cover" alt={`Audit Capture ${idx + 1}`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <Video size={24} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-[10px] text-slate-500 font-bold">No Screenshots Logged</p>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Violation Timeline</h4>
                    {selectedAttempt.violationTimeline && selectedAttempt.violationTimeline.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                        {selectedAttempt.violationTimeline.map((v, i) => (
                          <div key={i} className="flex justify-between items-start p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px]">
                            <div>
                              <span className="text-slate-400 font-mono block">{v.timestamp}</span>
                              <span className="font-bold text-slate-800">{v.type}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${
                              v.severity === 'critical' ? 'bg-red-50 text-red-600' :
                              v.severity === 'high' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'
                            }`}>{v.severity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                        <p className="text-[10px] text-slate-500 font-bold">No Violations Found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Question breakdown */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Question Breakdown</h4>
                  <div className="space-y-3">
                    {selectedAttempt.answers?.map((ans, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex flex-col gap-3 text-xs ${
                        ans.isCorrect ? 'bg-emerald-50/20 border-emerald-100' : 'bg-red-50/20 border-red-100'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-800 text-sm">Question {ans.questionIndex + 1}</span>
                            <p className="text-slate-700 font-medium text-sm mt-1 whitespace-pre-wrap">{ans.questionText}</p>
                          </div>
                          <span className={`font-bold ${ans.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                            {ans.isCorrect ? 'Correct (+1)' : 'Incorrect (-0.25)'}
                          </span>
                        </div>
                        
                        {ans.options && ans.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {ans.options.map((opt, oi) => {
                              const isSelected = ans.candidateAnswer && ans.candidateAnswer.includes(opt);
                              const isCorrectOption = ans.correctAnswer && ans.correctAnswer.includes(opt);
                              return (
                                <div key={oi} className={`px-3 py-2 rounded-xl text-[10px] font-bold border ${
                                  isCorrectOption 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                                    : isSelected
                                    ? 'bg-red-50 border-red-300 text-red-800'
                                    : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}>
                                  {opt}
                                  {isCorrectOption && ' (Correct Option)'}
                                  {isSelected && ' (Your Choice)'}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        <div className="mt-2 space-y-1 bg-white/50 p-3 rounded-lg border border-slate-100 text-[11px]">
                          <p className="text-slate-500 font-medium"><strong>Your Answer:</strong> {ans.candidateAnswer || <span className="italic text-slate-400">Skipped</span>}</p>
                          <p className="text-slate-700 font-medium"><strong>Correct Answer:</strong> {ans.correctAnswer}</p>
                          {ans.explanation && (
                            <p className="text-slate-600 text-xs mt-1 bg-slate-50 p-2 rounded border border-slate-100"><strong>Explanation:</strong> {ans.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Quiz;
