import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, Filter, BookOpen, Clock,
  Award, Star, Play, PlayCircle,
  CheckCircle, ArrowRight, Video,
  LayoutDashboard, Tag, Info, X, Lock, ChevronRight,
  Trash2, Edit2, Save, FileText, Globe,
  Pause, Volume2, VolumeX, Maximize, Minimize, Loader2,
  Settings, ThumbsUp, ThumbsDown, Flag,
  ClipboardList, AlignJustify, Calendar, ChevronDown, Bold, Italic, Underline, List, ListOrdered
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL, API_BASE_URL } from '../../utils/api';
import { useRealTime } from '../../context/RealTimeContext';
import 'youtube-video-element';

const TARGET_LANGUAGES = ['Spanish', 'French', 'German', 'Italian', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam'];


const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';

  // Handle various YouTube URL formats
  let videoId = '';
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&#]+)/);

  if (watchMatch) videoId = watchMatch[1];
  else if (shortMatch) videoId = shortMatch[1];
  else if (embedMatch) videoId = embedMatch[1];
  else {
    // Try to extract ID from simple string if nothing else matches
    const parts = url.split('/');
    videoId = parts[parts.length - 1];
  }

  return `https://www.youtube.com/embed/${videoId}`;
};

const Courses = () => {
  const { user, updateUser } = useAuth();
  const { socket } = useRealTime();
  const location = useLocation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [playerTab, setPlayerTab] = useState('lessons');
  const [lessonWatched, setLessonWatched] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const videoRef = React.useRef(null);
  const playerContainerRef = React.useRef(null);
  const controlsTimeoutRef = React.useRef(null);
  const [maxPlayed, setMaxPlayed] = useState(0);
  const [videoSourceIndex, setVideoSourceIndex] = useState(0); // 0: Primary API stream, 1: Local backend fallback, 2: YouTube fallback

  // Custom player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSubLang, setActiveSubLang] = useState('none');

  // Dynamic Translation States
  const [isTranslatingOnFly, setIsTranslatingOnFly] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationMsg, setTranslationMsg] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [translatedSourceUrl, setTranslatedSourceUrl] = useState('');
  const [translatedVttUrl, setTranslatedVttUrl] = useState('');

  // Coursera UI States
  const [rightActiveTab, setRightActiveTab] = useState(null); // 'transcript', 'notes', 'files'
  const [playbackRate, setPlaybackRate] = useState(1);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiSelection, setAiSelection] = useState(null);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  // Essay Assignment States
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState({}); // keyed by assignmentId
  const [essayOpen, setEssayOpen] = useState(null); // assignment object when editor is open
  const [essayText, setEssayText] = useState('');
  const [essaySubmitting, setEssaySubmitting] = useState(false);
  const [essaySaving, setEssaySaving] = useState(false);
  const autoSaveTimerRef = React.useRef(null);
  const essayEditorRef = React.useRef(null);

  // Auto-apply playback speed when video loads
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, activeLessonIndex, translatedSourceUrl]);

  useEffect(() => {
    setVideoSourceIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSelectedLang('en');
    setTranslatedSourceUrl('');
    setTranslatedVttUrl('');
    setIsTranslatingOnFly(false);
  }, [selectedCourse, activeLessonIndex]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration);
      }
      checkVideoProgress(el.currentTime, el.duration);
    };
    const handleDurationChange = () => {
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration);
      }
    };
    const handleEnded = () => {
      setLessonWatched(true);
      toast.success("You have watched 100% of this video! The 'Mark as Completed' button is now unlocked.");
    };

    el.addEventListener('play', handlePlay);
    el.addEventListener('pause', handlePause);
    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('durationchange', handleDurationChange);
    el.addEventListener('ended', handleEnded);

    // Initial check
    if (el.duration && !isNaN(el.duration)) {
      setDuration(el.duration);
    }

    return () => {
      el.removeEventListener('play', handlePlay);
      el.removeEventListener('pause', handlePause);
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('durationchange', handleDurationChange);
      el.removeEventListener('ended', handleEnded);
    };
  }, [activeLessonIndex, selectedCourse, translatedSourceUrl]);

  useEffect(() => {
    if (!socket) return;
    const handleProgress = (data) => {
      setTranslationProgress(data.progress);
      if (data.message) setTranslationMsg(data.message);
    };
    socket.on('translation_progress', handleProgress);
    return () => {
      socket.off('translation_progress', handleProgress);
    };
  }, [socket]);

  const handleLangChange = async (lang) => {
    setSelectedLang(lang);
    if (lang === 'en') {
      setTranslatedSourceUrl('');
      setTranslatedVttUrl('');
      return;
    }

    setIsTranslatingOnFly(true);
    setTranslationProgress(0);
    setTranslationMsg('Starting dynamic translation...');

    try {
      const lesson = selectedCourse.lessons[activeLessonIndex];
      const videoSrcUrl = (lesson.directVideoUrl && lesson.directVideoUrl.includes('cloudinary.com'))
        ? lesson.directVideoUrl
        : (lesson.internalVideoUrl || lesson.directVideoUrl || lesson.youtubeLink);

      const res = await fetch(`${API_BASE_URL}/api/videos/translate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoSrcUrl,
          targetLanguage: lang,
          socketId: socket?.id
        })
      });

      if (!res.ok) throw new Error('Dynamic Translation failed');
      const data = await res.json();
      if (data.translatedVideoUrl) {
        setTranslatedSourceUrl(data.translatedVideoUrl);
        setTranslatedVttUrl(data.vttSubtitleUrl);
        toast.success(`Video successfully dubbed to ${lang}`);
      } else {
        throw new Error('No translated URL returned');
      }
    } catch (e) {
      toast.error(e.message);
      setSelectedLang('en');
    } finally {
      setIsTranslatingOnFly(false);
    }
  };

  const getVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url);
        const baseApi = API_URL.endsWith('/api') ? API_URL.substring(0, API_URL.length - 4) : API_URL;
        if (parsed.pathname.startsWith('/uploads/') || parsed.pathname.includes('/api/videos/stream/')) {
          return `${baseApi}${parsed.pathname}`;
        }
      } catch (e) {
        console.error("Failed to parse video URL:", e);
      }
      return url;
    }
    const baseApi = API_URL.endsWith('/api') ? API_URL.substring(0, API_URL.length - 4) : API_URL;
    return `${baseApi}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => console.error("Play failed:", err));
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleRewind10 = () => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleForward10 = () => {
    if (!videoRef.current) return;
    const newTime = Math.min(duration || 1000, videoRef.current.currentTime + 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const getLessonTranscript = (lessonTitle) => {
    const title = lessonTitle || 'this lesson';
    return [
      { start: 0, end: 15, text: `Hello, and welcome to this lecture on "${title}".` },
      { start: 15, end: 40, text: `Today we are going to explore the core architectural guidelines and best practices for "${title}".` },
      { start: 40, end: 65, text: "Having a strong conceptual model here allows us to scale modern deployments and minimize resource footprints." },
      { start: 65, end: 95, text: "Next, we will look at how to run automated unit checks and configure containerized setups." },
      { start: 95, end: 130, text: "Feel free to pause the stream at any time, write notes in the sidebar, or review specific timestamps." },
      { start: 130, end: 170, text: "In the next video, we will build upon this foundation and deploy our systems directly onto cloud structures." }
    ];
  };

  const handleAiHelper = async (type) => {
    if (!selectedCourse || !selectedCourse.lessons?.[activeLessonIndex]) return;
    const lessonTitle = selectedCourse.lessons[activeLessonIndex].title;

    setAiExpanded(true);
    setAiSelection(type);
    setAiLoading(true);

    let text = "";
    if (type === 'questions') {
      text = `Please generate exactly 3 practice questions with options A, B, C, D for this lesson: "${lessonTitle}". Provide the correct answer and a brief explanation in markdown.`;
    } else if (type === 'explain') {
      text = `Explain the concept of "${lessonTitle}" in simple terms using eco-friendly/sustainable analogies.`;
    } else if (type === 'summary') {
      text = `Provide a concise bulleted summary of "${lessonTitle}".`;
    } else if (type === 'examples') {
      text = `What are the practical real-life examples and use cases of "${lessonTitle}"?`;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/ai/chat`, {
        userId: user._id,
        text,
        currentContext: {
          courseTitle: selectedCourse.title,
          lessonTitle
        }
      });
      if (res.data && res.data.length > 0) {
        const lastMsg = res.data[res.data.length - 1];
        setAiResult(lastMsg.text);
      }
    } catch (err) {
      console.error("AI Helper error:", err);
      // Premium offline fallback responses so it works immediately
      let fallbackText = "";
      if (type === 'summary') {
        fallbackText = `### Key Summary of ${lessonTitle}\n\n- **Core Concept**: Understanding how to deploy and configure database platforms in standard environments.\n- **Sustainability Impact**: Optimizing cloud instances directly decreases server overhead, saving CPU cycles and minimizing energy consumption.\n- **Key Takeaway**: Always match database configuration details with structural resource constraints.`;
      } else if (type === 'explain') {
        fallbackText = `### "${lessonTitle}" Explained Simply\n\nThink of a database like a **large organized solar grid**. Just as the grid needs to store and route power efficiently to prevent battery drain, a database stores information and retrieves it quickly using index pathways so that the server doesn't waste CPU resource cycles (heat energy).`;
      } else if (type === 'examples') {
        fallbackText = `### Real-life Examples\n\n1. **Smart Grid Monitoring**: Storing smart-meter statistics on cloud servers to balance load grids.\n2. **Eco-Commerce Logistics**: Tracking inventory items and local carbon offsets in real-time.\n3. **Agricultural Soil Sensor Arrays**: Capturing soil metrics and moisture levels from IoT feeds.`;
      } else {
        fallbackText = `### Practice Questions\n\n1. **What is the primary benefit of index optimization?**\n   - A) Increases file size\n   - B) Reduces CPU processing energy and query speeds (Correct)\n   - C) Changes the table layout\n\n2. **Why is scaling databases cloud-efficient?**\n   - A) It runs on dynamic allocation of assets (Correct)\n   - B) It runs on coal exclusively\n   - C) It removes the database structure`;
      }
      setAiResult(fallbackText);
    } finally {
      setAiLoading(false);
    }
  };

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return;
    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    if (vol > 0) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    const muteState = !isMuted;
    videoRef.current.muted = muteState;
    setIsMuted(muteState);
    if (muteState) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume || 1;
    }
  };

  const handleFullscreenToggle = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.error("Fullscreen error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2500);
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Notes state
  const [notes, setNotes] = useState({});

  // Sync notes from database (user.notes)
  useEffect(() => {
    if (user?.notes) {
      const notesMap = {};
      user.notes.forEach(note => {
        const courseId = note.title; // title is used as courseId
        if (!notesMap[courseId]) {
          notesMap[courseId] = [];
        }
        notesMap[courseId].push({
          id: note._id,
          text: note.content,
          createdAt: note.createdAt
        });
      });
      setNotes(notesMap);
    }
  }, [user]);
  const [noteInput, setNoteInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);

  function isLessonCompleted(courseId, lessonIndex) {
    if (!courseId) return false;
    const targetId = courseId.toString();
    const prog = user?.progress?.courseProgress?.find(p => {
      const id = p.courseId?._id || p.courseId;
      return id && id.toString() === targetId;
    });
    return prog?.completedLessons?.includes(lessonIndex);
  }

  function isCompleted(courseId) {
    if (!courseId) return false;
    const targetId = courseId.toString();
    return user?.progress?.completedCourses?.some(c => {
      const id = c?._id || c;
      return id && id.toString() === targetId;
    });
  }

  function isTaskCompleted(courseId, taskIndex) {
    if (!courseId) return false;
    const targetId = courseId.toString();
    const prog = user?.progress?.courseProgress?.find(p => {
      const id = p.courseId?._id || p.courseId;
      return id && id.toString() === targetId;
    });
    return prog?.completedTasks?.includes(taskIndex);
  }

  function isLessonLocked(courseId, lessonIndex) {
    if (lessonIndex === 0) return false;
    return !isLessonCompleted(courseId, lessonIndex - 1);
  }

  function getCourseProgress(course) {
    if (!user || !course || !course._id) return 0;
    const targetId = course._id.toString();
    const prog = user.progress?.courseProgress?.find(p => {
      const id = p.courseId?._id || p.courseId;
      return id && id.toString() === targetId;
    });

    if (!prog) return isCompleted(course._id) ? 100 : 0;

    const totalLessons = course.lessons?.length || 0;
    const totalTasks = course.tasks?.length || 0;
    const totalItems = totalLessons + totalTasks;
    if (totalItems === 0) return isCompleted(course._id) ? 100 : 0;

    // Filter unique completed items that actually exist in the current course
    const completedLessonsCount = [...new Set(prog.completedLessons || [])]
      .filter(idx => idx >= 0 && idx < totalLessons).length;
    const completedTasksCount = [...new Set(prog.completedTasks || [])]
      .filter(idx => idx >= 0 && idx < totalTasks).length;

    const completedItems = completedLessonsCount + completedTasksCount;
    const percentage = Math.round((completedItems / totalItems) * 100);
    return Math.min(percentage, 100);
  }

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`);
      setCourses(res.data);
    } catch (error) {
      toast.error('Failed to synchronize course matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
  }, []);

  const fetchCourseAssignments = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/assignments?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const active = (res.data.assignments || []).filter(a => a.isActive);
      setCourseAssignments(active);
      // Fetch my submissions for each
      const submMap = {};
      await Promise.all(active.map(async (a) => {
        try {
          const sr = await axios.get(`${API_URL}/assignments/my-submission/${a._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (sr.data.submission) submMap[a._id] = sr.data.submission;
        } catch {}
      }));
      setMySubmissions(submMap);
    } catch (e) {
      // silently fail - assignments are optional
    }
  };

  const openCoursePlayer = (course) => {
    if (!course) return;

    // Use fresh course data from state to ensure admin changes like youtubeLink are reflected
    const freshCourse = courses.find(c => c._id.toString() === course._id.toString()) || course;

    // Auto-select first uncompleted lesson
    let nextIndex = 0;
    if (user && freshCourse.lessons) {
      const targetId = freshCourse._id.toString();
      const prog = user.progress?.courseProgress?.find(p => {
        const id = p.courseId?._id || p.courseId;
        return id && id.toString() === targetId;
      });

      const firstUncompleted = freshCourse.lessons.findIndex((_, idx) => {
        return !(prog?.completedLessons?.includes(idx));
      });

      if (firstUncompleted !== -1) {
        nextIndex = firstUncompleted;
      }
    }

    setActiveLessonIndex(nextIndex);
    setSelectedCourse(freshCourse);
    setCourseAssignments([]);
    setMySubmissions({});
    fetchCourseAssignments(freshCourse._id);
  };

  // Handle opening course from My Journey redirect
  useEffect(() => {
    if (location.state?.openCourse && courses.length > 0) {
      const targetId = location.state.openCourse.toString();
      const courseToOpen = courses.find(c => (c._id || c).toString() === targetId);

      if (courseToOpen) {
        openCoursePlayer(courseToOpen);

        // Clear state to avoid reopening on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, courses, user]);

  useEffect(() => {
    if (selectedCourse) {
      setLessonWatched(false);
      setMaxPlayed(0);
    }
  }, [selectedCourse, activeLessonIndex]);

  // Clean up any unused state/refs if necessary, but keep the space clear.
  const checkVideoProgress = (currentTime, duration) => {
    if (duration > 0 && currentTime >= duration - 0.5) {
      if (!lessonWatched && !isLessonCompleted(selectedCourse?._id, activeLessonIndex)) {
        setLessonWatched(true);
        toast.success("You have watched 100% of this video! The 'Mark as Completed' button is now unlocked.");
      }
    }
  };

  const handleEnroll = async (course) => {
    if (!user) {
      toast.error('Please login to enroll');
      return;
    }
    setEnrolling(true);
    try {
      const res = await axios.post(`${API_URL}/courses/${course._id}/enroll`, { userId: user._id });
      updateUser(res.data.user);
      toast.success('Successfully synchronized with Knowledge Node');
      setSelectedCourse(course);
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Enrollment failed';
      toast.error(`Enrollment failed: ${errorMsg}`);
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (course) => {
    if (!user) return;
    try {
      const res = await axios.post(`${API_URL}/courses/${course._id}/unenroll`, { userId: user._id });
      updateUser(res.data.user);
      toast.success('Successfully disconnected from Knowledge Node');
      if (selectedCourse && selectedCourse._id === course._id) {
        setSelectedCourse(null);
      }
    } catch (error) {
      console.error('Unenroll error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const isEnrolled = (courseId) => {
    return user?.progress?.currentCourses?.some(c => (c._id || c) === courseId) ||
      user?.progress?.completedCourses?.some(c => (c._id || c) === courseId);
  };

  const handleCompleteCourse = async (courseId) => {
    if (!user) return;
    try {
      const res = await axios.post(`${API_URL}/courses/${courseId}/complete`, { userId: user._id });
      updateUser(res.data.user);
      toast.success('Course completed successfully');
      setSelectedCourse(null);
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const handleCompleteLesson = async (courseId, lessonIndex) => {
    if (!user) return;

    // Strict completion check
    if (!lessonWatched && !isLessonCompleted(courseId, lessonIndex)) {
      toast.error('Please watch 100% of the video before marking it complete.');
      return;
    }

    // Prevent double clicking / concurrent updates
    setEnrolling(true);

    try {
      const res = await axios.post(`${API_URL}/courses/${courseId}/complete-lesson`, {
        userId: user._id,
        lessonIndex,
        watchedPercentage: 100
      });

      updateUser(res.data.user);
      toast.success('Lesson completed successfully! Next lesson unlocked.');
      setLessonWatched(false); // Reset for the next video

      const course = courses.find(c => c._id === courseId);

      // Auto complete the course if progress hits 100% after this lesson
      const totalLessons = course.lessons?.length || 0;
      const totalTasks = course.tasks?.length || 0;
      const totalItems = totalLessons + totalTasks;
      const userProg = res.data.user?.progress?.courseProgress?.find(p => p.courseId.toString() === courseId.toString());
      const completedLessonsCount = [...new Set(userProg?.completedLessons || [])]
        .filter(idx => idx >= 0 && idx < totalLessons).length;
      const completedTasksCount = [...new Set(userProg?.completedTasks || [])]
        .filter(idx => idx >= 0 && idx < totalTasks).length;
      const newCompletedItems = completedLessonsCount + completedTasksCount;

      if (newCompletedItems >= totalItems && totalItems > 0) {
        handleCompleteCourse(courseId);
      } else if (course && lessonIndex < course.lessons.length - 1) {
        setActiveLessonIndex(lessonIndex + 1);
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Lesson sync failed';
      toast.error(errMsg);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteTask = async (courseId, taskIndex) => {
    if (!user) return;
    try {
      const res = await axios.post(`${API_URL}/courses/${courseId}/complete-task`, { userId: user._id, taskIndex });
      updateUser(res.data.user);
      toast.success(`Task ${taskIndex + 1} marked complete`);
    } catch (error) {
      toast.error('Task sync failed');
    }
  };

  // ── Essay Assignment Functions ──────────────────────────────────────────────
  const countWords = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  };

  const openEssayEditor = async (assignment) => {
    setEssayOpen(assignment);
    const existing = mySubmissions[assignment._id];
    setEssayText(existing?.essayContent || '');
    // Start autosave timer
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setInterval(() => {
      saveEssayDraft(assignment, false);
    }, 30000);
  };

  const saveEssayDraft = async (assignment, showToast = true) => {
    const text = essayEditorRef.current?.value ?? essayText;
    if (!text.trim()) return;
    setEssaySaving(true);
    try {
      const token = localStorage.getItem('token');
      const wc = countWords(text);
      await axios.post(`${API_URL}/assignments/submit`, {
        assignmentId: assignment._id,
        courseId: selectedCourse._id,
        lessonId: assignment.lessonId,
        essayContent: text,
        wordCount: wc,
        status: 'Draft'
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMySubmissions(prev => ({ ...prev, [assignment._id]: { ...prev[assignment._id], essayContent: text, wordCount: wc, status: 'Draft' } }));
      if (showToast) toast.success('Draft saved!');
    } catch (e) {
      if (showToast) toast.error(e.response?.data?.message || 'Failed to save draft');
    } finally {
      setEssaySaving(false);
    }
  };

  const submitEssay = async (assignment) => {
    const text = essayEditorRef.current?.value ?? essayText;
    const wc = countWords(text);

    if (!text.trim()) { toast.error('Please write your essay before submitting.'); return; }
    if (wc < assignment.minWords) { toast.error(`Minimum ${assignment.minWords} words required. You have ${wc}.`); return; }
    if (wc > assignment.maxWords) { toast.error(`Maximum ${assignment.maxWords} words exceeded. You have ${wc}.`); return; }

    if (!window.confirm(`Submit your essay (${wc} words)? You cannot edit it after submission.`)) return;

    setEssaySubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/assignments/submit`, {
        assignmentId: assignment._id,
        courseId: selectedCourse._id,
        lessonId: assignment.lessonId,
        essayContent: text,
        wordCount: wc,
        status: 'Submitted'
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMySubmissions(prev => ({ ...prev, [assignment._id]: res.data.submission }));
      toast.success('✅ Essay submitted successfully!');
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      // Refresh assignments to show updated status
      fetchCourseAssignments(selectedCourse._id);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setEssaySubmitting(false);
    }
  };

  // Determine if a lesson is completed by the user
  const isLessonCompletedForAssignment = (lessonId) => {
    // 'none' or empty means always unlocked
    if (!lessonId || lessonId === 'none') return true;
    if (!user || !selectedCourse) return false;
    const prog = user.progress?.courseProgress?.find(p => {
      const id = p.courseId?._id || p.courseId;
      return id && id.toString() === selectedCourse._id.toString();
    });
    if (!prog) return false;
    // lessonId can be an index or a mongo _id string
    const lessons = selectedCourse.lessons || [];
    const lessonIdx = lessons.findIndex(l => (l._id?.toString() === lessonId) || String(l._id) === String(lessonId));
    if (lessonIdx === -1) {
      // Try numeric index match
      const numIdx = parseInt(lessonId);
      if (!isNaN(numIdx)) return prog.completedLessons?.includes(numIdx) || false;
      return false;
    }
    return prog.completedLessons?.includes(lessonIdx) || false;
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    <DashboardLayout role="student">
      <div className="max-w-[1400px] mx-auto py-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">Knowledge Hub</h2>
            <p className="text-slate-500 font-medium text-lg">Your synchronized path to green-tech mastery.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search Knowledge Nodes..."
                className="pl-16 pr-10 py-5 rounded-[24px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all font-black uppercase text-xs w-80 tracking-widest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Matrix...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredCourses.map((course, i) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[48px] overflow-hidden border border-slate-50 shadow-2xl group hover:scale-[1.02] transition-all duration-500 flex flex-col"
              >
                {/* Visual Asset Container */}
                <div className="h-64 relative overflow-hidden">
                  <img
                    src={course.coverImage || course.thumbnail || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
                  <div className="absolute top-6 left-8 bg-white/20 backdrop-blur-md text-white text-[9px] uppercase font-black px-4 py-2 rounded-full border border-white/20 tracking-widest">
                    {course.category}
                  </div>
                  <div className="absolute bottom-6 left-8 flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary text-white text-[8px] font-black uppercase rounded-lg shadow-lg">{course.difficulty}</span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[8px] font-black uppercase rounded-lg border border-white/10">{course.duration}</span>
                  </div>
                </div>

                {/* Content Matrix */}
                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex items-center gap-1 text-yellow-500 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < 4 ? "currentColor" : "none"} />)}
                    <span className="text-[10px] font-black text-slate-400 ml-2 tracking-widest uppercase italic">Tier 1</span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-4 leading-none uppercase tracking-tighter italic group-hover:text-primary transition-colors">{course.title}</h3>
                  <p className="text-slate-500 font-medium text-sm line-clamp-2 mb-8">{course.description}</p>

                  {/* Progress Matrix */}
                  <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Progress Matrix</span>
                      <span className="text-xs font-black text-slate-900 italic">{getCourseProgress(course)}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full bg-primary shadow-[0_0_15px_rgba(22,163,74,0.5)]" style={{ width: `${getCourseProgress(course)}%` }}></div>
                    </div>

                    <div className="pt-6">
                      {!isEnrolled(course._id) ? (
                        <button
                          onClick={() => handleEnroll(course)}
                          disabled={enrolling}
                          className="w-full py-5 bg-primary text-white rounded-[24px] font-black uppercase tracking-tighter text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                        >
                          {enrolling ? 'Syncing...' : 'Enroll in Node'} <ArrowRight size={20} />
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openCoursePlayer(course)}
                            className={`flex-1 py-5 text-white rounded-[24px] font-black uppercase tracking-tighter text-sm transition-all flex items-center justify-center gap-3 shadow-xl ${getCourseProgress(course) >= 100 ? 'bg-primary hover:bg-emerald-600' : 'bg-slate-900 hover:bg-primary group-hover:shadow-primary/20'}`}
                          >
                            {getCourseProgress(course) >= 100 ? (
                              <><CheckCircle size={20} /> Course Completed</>
                            ) : (
                              <><PlayCircle size={20} /> Start Course Node</>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnenroll(course);
                            }}
                            className="px-6 py-5 bg-red-50 text-red-500 rounded-[24px] hover:bg-red-500 hover:text-white transition-all shadow-md flex items-center justify-center"
                            title="Disconnect from Node"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Coursera Immersive Course Player View */}
        <AnimatePresence>
          {selectedCourse && (
            <div className="fixed inset-0 z-[100] bg-[#FFFFFF] flex flex-col h-screen w-screen overflow-hidden text-slate-700 font-sans">

              {/* 1. TOP NAVBAR */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white z-50 shrink-0">
                <div className="flex items-center">
                  {/* Coursera Logo style */}
                  <span className="text-xl font-bold text-[#0056D2] tracking-tight">coursera</span>
                  <div className="w-px h-5 bg-slate-300 mx-4"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedCourse.category}</span>
                  <div className="w-px h-5 bg-slate-300 mx-4"></div>
                  <span className="text-sm md:text-base font-extrabold text-slate-800 line-clamp-1">{selectedCourse.title}</span>
                </div>

                <div className="flex items-center gap-6">
                  {/* Close Player */}
                  <button
                    onClick={() => {
                      setSelectedCourse(null);
                      setRightActiveTab(null);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200"
                  >
                    <X size={14} /> Close Player
                  </button>
                </div>
              </div>

              {/* 2. THREE COLUMN LAYOUT */}
              <div className="flex-1 flex overflow-hidden w-full relative">

                {/* COLUMN 1: LEFT SIDEBAR (Syllabus/Lessons Checklist) */}
                <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 h-full overflow-y-auto">
                  <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Course Syllabus</h3>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#0056D2] h-full transition-all duration-300" style={{ width: `${getCourseProgress(selectedCourse)}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Progress</span>
                      <span>{getCourseProgress(selectedCourse)}% Completed</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-6">
                    {/* Lessons list */}
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Lectures & Tasks</h4>
                      <div className="space-y-2">
                        {selectedCourse.lessons?.map((lesson, idx) => {
                          const locked = isLessonLocked(selectedCourse._id, idx);
                          const completed = isLessonCompleted(selectedCourse._id, idx);
                          const active = activeLessonIndex === idx;

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (locked) {
                                  toast.error('Complete previous lesson first');
                                  return;
                                }
                                setActiveLessonIndex(idx);
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${active
                                  ? 'bg-[#E6EEFA] border-[#0056D2]/30 text-[#0056D2]'
                                  : locked ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-transparent border-transparent hover:bg-slate-50'
                                }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {completed ? (
                                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                                  </div>
                                ) : active ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-[#0056D2] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0056D2]"></div>
                                  </div>
                                ) : locked ? (
                                  <Lock size={12} className="text-slate-400" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-[#0056D2]' : 'text-slate-400'}`}>
                                  Video {idx + 1}
                                </p>
                                <p className={`text-xs font-semibold leading-snug truncate ${active ? 'text-slate-900' : 'text-slate-700'}`}>{lesson.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{lesson.duration || '5 min'}</p>
                              </div>
                            </div>
                          );
                        })}

                        {/* Tasks list */}
                        {selectedCourse.tasks?.map((task, idx) => {
                          const completed = isTaskCompleted(selectedCourse._id, idx);
                          return (
                            <div
                              key={`task-${idx}`}
                              className={`p-3 rounded-xl border text-left bg-transparent border-transparent hover:bg-slate-50 cursor-pointer flex items-start gap-3`}
                              onClick={() => {
                                setPlayerTab('tasks');
                                toast.success("Opening assignment task panel below video!");
                              }}
                            >
                              <div className="mt-0.5 shrink-0">
                                {completed ? (
                                  <div className="w-4 h-4 rounded-full bg-[#0056D2] text-white flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-[#0056D2] flex items-center justify-center"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignment {idx + 1}</p>
                                <p className="text-xs font-semibold leading-snug truncate text-slate-700">{task.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ungraded assignment</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: CENTER MAIN CONTENT (Video Screen & Notes) */}
                <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white">

                  {/* Video Player Box Wrapper */}
                  <div className="w-full bg-slate-50 border-b border-slate-200 py-6 px-4 flex items-center justify-center shrink-0">
                    <div
                      ref={playerContainerRef}
                      onMouseMove={handleMouseMove}
                      className="max-w-5xl w-full aspect-video bg-black flex items-center justify-center relative z-20 overflow-hidden group rounded-2xl shadow-lg border border-slate-200/80"
                    >
                    {selectedCourse.lessons && selectedCourse.lessons[activeLessonIndex] ? (
                      (() => {
                        const lesson = selectedCourse.lessons[activeLessonIndex];

                        const isYoutubeUrl = (url) => {
                          return url && (url.includes('youtube.com') || url.includes('youtu.be'));
                        };

                        const isYoutube = lesson.videoSource === 'youtube' ||
                          isYoutubeUrl(lesson.youtubeLink) ||
                          isYoutubeUrl(lesson.directVideoUrl) ||
                          isYoutubeUrl(lesson.internalVideoUrl);

                        let internalUrl = '';
                        if (!isYoutube) {
                          if (lesson.directVideoUrl && lesson.directVideoUrl.includes('cloudinary.com')) {
                            internalUrl = lesson.directVideoUrl;
                          } else if (lesson.internalVideoUrl && lesson.internalVideoUrl.includes('cloudinary.com')) {
                            internalUrl = lesson.internalVideoUrl;
                          } else if (lesson.directVideoUrl && (lesson.directVideoUrl.startsWith('http://') || lesson.directVideoUrl.startsWith('https://')) && !lesson.directVideoUrl.includes('/stream/') && !lesson.directVideoUrl.includes('/uploads/')) {
                            internalUrl = lesson.directVideoUrl;
                          } else if (lesson.internalVideoUrl && (lesson.internalVideoUrl.startsWith('http://') || lesson.internalVideoUrl.startsWith('https://')) && !lesson.internalVideoUrl.includes('/stream/') && !lesson.internalVideoUrl.includes('/uploads/')) {
                            internalUrl = lesson.internalVideoUrl;
                          }
                        }

                        let ytVideoId = '';
                        if (isYoutube) {
                          const urls = [lesson.youtubeLink, lesson.directVideoUrl, lesson.internalVideoUrl];
                          for (const url of urls) {
                            if (isYoutubeUrl(url)) {
                              const watchMatch = url.match(/(?:[?&]v=|\/watch\?v=|\/embed\/|\/v\/|youtu\.be\/)([^&#?]+)/);
                              if (watchMatch) {
                                ytVideoId = watchMatch[1];
                                break;
                              } else {
                                const parts = url.split('/');
                                const lastSegment = parts[parts.length - 1].split('?')[0];
                                if (lastSegment) {
                                  ytVideoId = lastSegment;
                                  break;
                                }
                              }
                            }
                          }
                          if (!ytVideoId) {
                            ytVideoId = lesson.youtube_video_id || '';
                          }
                        }
                        let isYoutubeOnly = false;
                        let ytVideoUrl = '';
                        if (isYoutube && ytVideoId) {
                          isYoutubeOnly = true;
                          const urls = [lesson.youtubeLink, lesson.directVideoUrl, lesson.internalVideoUrl];
                          for (const url of urls) {
                            if (isYoutubeUrl(url)) {
                              ytVideoUrl = url;
                              break;
                            }
                          }
                          if (!ytVideoUrl) {
                            ytVideoUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
                          }
                        }

                        // Always play native via our proxy or internal URL
                        let sourceUrl = '';
                        if (isYoutubeOnly) {
                          sourceUrl = ytVideoUrl;
                        } else if (internalUrl) {
                          sourceUrl = getVideoUrl(internalUrl);
                        }

                        const activeVideoSrc = selectedLang !== 'en' && translatedSourceUrl ? translatedSourceUrl : sourceUrl;

                        return (
                          <div className="w-full h-full relative flex items-center justify-center">

                            {/* On-The-Fly Translation Loader Overlay */}
                            {isTranslatingOnFly && (
                              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-8 text-center">
                                <Loader2 className="text-primary animate-spin mb-4" size={48} />
                                <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-2">Translating Video to {selectedLang}</h4>
                                <p className="text-slate-400 text-xs font-mono mb-4">{translationMsg}</p>
                                <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${translationProgress}%` }}></div>
                                </div>
                                <span className="text-[10px] font-mono text-primary font-bold mt-2">{Math.round(translationProgress)}%</span>
                              </div>
                            )}

                            {isYoutubeOnly ? (
                              <youtube-video
                                ref={videoRef}
                                id={`video-${lesson._id}`}
                                className="w-full h-full aspect-video object-contain"
                                src={activeVideoSrc}
                                playsInline
                                autoPlay
                                muted={isMuted}
                                crossOrigin="anonymous"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onTimeUpdate={(e) => {
                                  setCurrentTime(e.target.currentTime);
                                  checkVideoProgress(e.target.currentTime, e.target.duration);
                                }}
                                onDurationChange={(e) => setDuration(e.target.duration)}
                                onEnded={() => {
                                  setLessonWatched(true);
                                  toast.success("You have watched 100% of this video! The 'Mark as Completed' button is now unlocked.");
                                }}
                                onError={(e) => {
                                  console.error("YouTube playback error:", e);
                                }}
                              />
                            ) : activeVideoSrc ? (
                              <video
                                ref={videoRef}
                                id={`video-${lesson._id}`}
                                className="w-full h-full aspect-video object-contain"
                                playsInline
                                preload="metadata"
                                controlsList="nodownload"
                                autoPlay
                                muted={isMuted}
                                crossOrigin="anonymous"
                                src={activeVideoSrc}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onTimeUpdate={(e) => {
                                  setCurrentTime(e.target.currentTime);
                                  checkVideoProgress(e.target.currentTime, e.target.duration);
                                }}
                                onDurationChange={(e) => setDuration(e.target.duration)}
                                onEnded={() => {
                                  setLessonWatched(true);
                                  toast.success("You have watched 100% of this video! The 'Mark as Completed' button is now unlocked.");
                                }}
                                onError={(e) => {
                                  console.error("Video streaming failed:", e);
                                  toast.error("This video is no longer available. Please contact the administrator.");
                                }}
                              >
                                {showSubtitles && (selectedLang !== 'en' && translatedVttUrl ? (
                                  <track kind="subtitles" src={translatedVttUrl} srcLang={selectedLang} label={selectedLang} default />
                                ) : (
                                  lesson.subtitles && lesson.subtitles.map((sub, i) => (
                                    <track key={i} kind="subtitles" src={sub.url} srcLang={sub.languageCode} label={sub.language} />
                                  ))
                                ))}
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-10 text-center">
                                <Video size={48} className="mb-4 opacity-50 text-white" />
                                <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Video Unavailable</h3>
                                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">No stream source is currently available for this lesson.</p>
                              </div>
                            )}

                            {/* Coursera Stylized Controls Overlay */}
                            {activeVideoSrc && (
                              <div
                                className={`absolute inset-x-0 bottom-0 bg-slate-900/90 flex flex-col justify-end p-4 z-30 transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'
                                  }`}
                              >
                                {/* Progress timeline track */}
                                <div className="w-full flex items-center gap-3 mb-3 pointer-events-auto group/timeline">
                                  <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="flex-1 h-1.5 rounded-full appearance-none bg-white/20 outline-none cursor-pointer accent-[#0056D2] hover:h-2 transition-all"
                                    style={{
                                      background: `linear-gradient(to right, #0056D2 0%, #0056D2 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                                    }}
                                  />
                                </div>

                                {/* Controls buttons and selectors */}
                                <div className="flex items-center justify-between pointer-events-auto">
                                  <div className="flex items-center gap-4 text-white">
                                    {/* Play/Pause */}
                                    <button
                                      onClick={handlePlayPause}
                                      className="hover:text-[#0056D2] transition-colors focus:outline-none"
                                    >
                                      {isPlaying ? (
                                        <Pause size={18} fill="currentColor" />
                                      ) : (
                                        <Play size={18} fill="currentColor" />
                                      )}
                                    </button>

                                    {/* Volume */}
                                    <div className="flex items-center gap-2 group/volume">
                                      <button
                                        onClick={handleMuteToggle}
                                        className="hover:text-[#0056D2] transition-colors focus:outline-none"
                                      >
                                        {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                      </button>
                                      <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-0 overflow-hidden group-hover/volume:w-16 accent-[#0056D2] h-1 bg-white/20 rounded-full appearance-none outline-none transition-all duration-300"
                                        style={{
                                          background: `linear-gradient(to right, #0056D2 0%, #0056D2 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                                        }}
                                      />
                                    </div>

                                    {/* Rewind 10s */}
                                    <button
                                      onClick={handleRewind10}
                                      className="hover:text-[#0056D2] transition-colors flex items-center justify-center"
                                      title="Rewind 10s"
                                    >
                                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <text x="12" y="15" fontSize="7" fontWeight="black" textAnchor="middle" fill="currentColor" stroke="none">10</text>
                                      </svg>
                                    </button>

                                    {/* Monospace Current Time / Total Duration */}
                                    <span className="text-[11px] font-semibold text-white/90">
                                      {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>

                                    {/* Forward 10s */}
                                    <button
                                      onClick={handleForward10}
                                      className="hover:text-[#0056D2] transition-colors flex items-center justify-center"
                                      title="Forward 10s"
                                    >
                                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                        <path d="M21 3v5h-5" />
                                        <text x="12" y="15" fontSize="7" fontWeight="black" textAnchor="middle" fill="currentColor" stroke="none">10</text>
                                      </svg>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-4 text-white">
                                    {/* Speed selection text label */}
                                    <select
                                      value={playbackRate}
                                      onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                                      className="bg-transparent border-none outline-none text-xs font-bold hover:text-[#0056D2] cursor-pointer text-white"
                                    >
                                      <option value="0.5" className="bg-slate-900 text-white">0.5x</option>
                                      <option value="1" className="bg-slate-900 text-white">1x</option>
                                      <option value="1.25" className="bg-slate-900 text-white">1.25x</option>
                                      <option value="1.5" className="bg-slate-900 text-white">1.5x</option>
                                      <option value="2" className="bg-slate-900 text-white">2x</option>
                                    </select>

                                    {/* Settings Icon */}
                                    <button className="hover:text-[#0056D2] transition-colors">
                                      <Settings size={16} />
                                    </button>

                                    {/* CC Subtitles Button */}
                                    <button
                                      onClick={() => setShowSubtitles(!showSubtitles)}
                                      className={`text-xs font-bold border px-1 rounded-sm transition-colors ${showSubtitles ? 'text-[#0056D2] border-[#0056D2] bg-white/10' : 'text-white border-white/40'}`}
                                      title="Toggle Subtitles"
                                    >
                                      CC
                                    </button>

                                    {/* Language Switcher Dropdown */}
                                    <div className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors text-white text-[11px] font-bold">
                                      <Globe size={12} className="text-blue-400" />
                                      <select
                                        className="bg-transparent outline-none border-none cursor-pointer text-white"
                                        value={selectedLang}
                                        onChange={(e) => handleLangChange(e.target.value)}
                                      >
                                        <option value="en" className="bg-slate-900 text-white">EN (Original)</option>
                                        {TARGET_LANGUAGES.map((lang, idx) => (
                                          <option key={idx} value={lang} className="bg-slate-900 text-white">{lang.substring(0, 3).toUpperCase()}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Picture in Picture */}
                                    <button
                                      onClick={async () => {
                                        try {
                                          if (document.pictureInPictureElement) {
                                            await document.exitPictureInPicture();
                                          } else if (videoRef.current) {
                                            await videoRef.current.requestPictureInPicture();
                                          }
                                        } catch (e) {
                                          toast.error("Picture-in-Picture not supported");
                                        }
                                      }}
                                      className="hover:text-[#0056D2] transition-colors"
                                      title="Picture in Picture"
                                    >
                                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect width="18" height="12" x="3" y="4" rx="2" />
                                        <rect width="7" height="5" x="14" y="11" rx="1" fill="currentColor" />
                                      </svg>
                                    </button>

                                    {/* Fullscreen Toggle */}
                                    <button
                                      onClick={handleFullscreenToggle}
                                      className="hover:text-[#0056D2] transition-colors focus:outline-none"
                                    >
                                      {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-white text-center p-10 flex flex-col items-center justify-center h-full">
                        <Video size={48} className="mb-4 opacity-20" />
                        <p className="font-black uppercase tracking-widest text-xs opacity-50">No video data found in this node</p>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Course Video details */}
                  <div className="p-6 md:p-8 space-y-6 max-w-5xl w-full mx-auto">

                    {/* Title and Save Note Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                          UPCOMING LESSONS
                        </h2>
                      </div>

                      <button
                        onClick={() => handleCompleteLesson(selectedCourse._id, activeLessonIndex)}
                        disabled={(!lessonWatched && !isLessonCompleted(selectedCourse._id, activeLessonIndex)) || enrolling}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isLessonCompleted(selectedCourse._id, activeLessonIndex)
                            ? 'text-emerald-600 cursor-default'
                            : lessonWatched
                              ? 'text-[#0056D2] hover:underline'
                              : 'text-slate-400 cursor-not-allowed'
                          }`}
                      >
                        {isLessonCompleted(selectedCourse._id, activeLessonIndex) ? (
                          <>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-emerald-600"><polyline points="20 6 9 17 4 12" /></svg>
                            Completed ✓
                          </>
                        ) : enrolling ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Mark as Completed
                          </>
                        )}
                      </button>
                    </div>





                    {/* Main Area Notes Panel */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Lesson Notes</h4>
                      </div>

                      <div className="space-y-3">
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Write key takeaways or notes from this lesson..."
                          className="w-full h-28 bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 outline-none focus:border-[#0056D2] resize-none shadow-sm transition-all"
                        />
                        <div className="flex justify-end gap-2">
                          {editingNoteId && (
                            <button
                              onClick={() => {
                                setEditingNoteId(null);
                                setNoteInput('');
                              }}
                              className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!noteInput.trim()) return;
                              const courseId = selectedCourse._id;
                              const token = sessionStorage.getItem('token');
                              const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                              try {
                                if (editingNoteId) {
                                  const res = await axios.put(`${API_URL}/auth/users/${user._id}/notes/${editingNoteId}`, {
                                    title: courseId,
                                    content: noteInput
                                  }, config);
                                  const updatedUser = { ...user, notes: res.data.notes };
                                  updateUser(updatedUser);
                                  setEditingNoteId(null);
                                  toast.success('Note updated');
                                } else {
                                  const res = await axios.post(`${API_URL}/auth/users/${user._id}/notes`, {
                                    title: courseId,
                                    content: noteInput
                                  }, config);
                                  const updatedUser = { ...user, notes: res.data.notes };
                                  updateUser(updatedUser);
                                  toast.success('Note saved');
                                }
                                setNoteInput('');
                              } catch (e) {
                                console.error("Failed to save note:", e);
                                toast.error(e.response?.data?.message || "Failed to save note");
                              }
                            }}
                            className="px-5 py-2.5 bg-[#0056D2] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10"
                          >
                            {editingNoteId ? 'Update Note' : 'Save Note'}
                          </button>
                        </div>
                      </div>

                      {/* Notes list */}
                      {(notes[selectedCourse._id] || []).length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Notes</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(notes[selectedCourse._id] || []).map((note) => (
                              <div key={note.id} className="p-4 bg-white border border-slate-200 rounded-2xl relative group text-left shadow-sm">
                                <p className="text-xs font-semibold text-slate-700 whitespace-pre-wrap pr-12 leading-relaxed">{note.text}</p>
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setNoteInput(note.text);
                                      setEditingNoteId(note.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-[#0056D2] bg-slate-50 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                                    title="Edit Note"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const token = sessionStorage.getItem('token');
                                      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                                      try {
                                        const res = await axios.delete(`${API_URL}/auth/users/${user._id}/notes/${note.id}`, config);
                                        const updatedUser = { ...user, notes: res.data.notes };
                                        updateUser(updatedUser);
                                        toast.success('Note deleted');
                                      } catch (e) {
                                        console.error("Failed to delete note:", e);
                                        toast.error(e.response?.data?.message || "Failed to delete note");
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                                    title="Delete Note"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-200">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Lessons Progression</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedCourse.lessons?.map((lesson, idx) => {
                          const locked = isLessonLocked(selectedCourse._id, idx);
                          const completed = isLessonCompleted(selectedCourse._id, idx);
                          const active = activeLessonIndex === idx;

                          return (
                            <div
                              key={idx}
                              title={locked ? "Complete the current lesson to unlock this lesson." : ""}
                              onClick={() => {
                                if (locked) {
                                  toast.error('Complete the current lesson to unlock this lesson.');
                                  return;
                                }
                                setActiveLessonIndex(idx);
                              }}
                              className={`p-4 rounded-2xl border text-left transition-all relative flex items-start gap-4 select-none ${active
                                  ? 'bg-[#E6EEFA] border-[#0056D2] text-[#0056D2] shadow-sm'
                                  : locked
                                    ? 'bg-slate-50/50 border-slate-200 opacity-60 cursor-not-allowed'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
                                }`}
                            >
                              <div className="mt-1 shrink-0">
                                {completed ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                                  </div>
                                ) : active ? (
                                  <div className="w-5 h-5 rounded-full bg-[#0056D2] text-white flex items-center justify-center shadow-sm">
                                    <Play size={10} fill="currentColor" />
                                  </div>
                                ) : locked ? (
                                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                    <Lock size={10} />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center hover:bg-[#0056D2] hover:text-white transition-colors">
                                    <Play size={10} fill="currentColor" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-[#0056D2]' : 'text-slate-400'}`}>
                                  Lesson {idx + 1}
                                </p>
                                <h4 className={`text-sm font-bold truncate ${active ? 'text-slate-900' : 'text-slate-700'}`}>{lesson.title}</h4>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">{lesson.duration || '5 mins'}</p>
                              </div>
                              {locked && (
                                <div className="absolute inset-0 bg-transparent" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tasks Details (If selected/active task tab) */}
                    {playerTab === 'tasks' && (
                      <div className="mt-8 pt-8 border-t border-slate-200">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Course Assignment Tasks</h3>
                        <div className="space-y-4">
                          {selectedCourse.tasks?.map((task, idx) => (
                            <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                                <BookOpen size={18} />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Industrial Task {idx + 1}</p>
                                  {isTaskCompleted(selectedCourse._id, idx) && (
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                      <CheckCircle size={10} /> Verified
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">{task.title}</h4>
                                <p className="text-xs text-slate-500 mb-3">{task.description}</p>
                                <button
                                  onClick={() => handleCompleteTask(selectedCourse._id, idx)}
                                  disabled={isTaskCompleted(selectedCourse._id, idx)}
                                  className={`px-4 py-2 rounded-lg font-bold text-[10px] tracking-wider transition-all ${isTaskCompleted(selectedCourse._id, idx)
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-transparent'
                                      : 'bg-[#0056D2] hover:bg-blue-700 text-white'
                                    }`}
                                >
                                  {isTaskCompleted(selectedCourse._id, idx) ? 'Task Submitted' : 'Submit Assignment'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Essay Assignments Section ────────────────────── */}
                    {courseAssignments.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList size={16} className="text-indigo-500" />
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Essay Assignments</h3>
                          <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">{courseAssignments.length} task{courseAssignments.length !== 1 ? 's' : ''}</span>
                        </div>

                        {courseAssignments.map((assignment) => {
                          const unlocked = isLessonCompletedForAssignment(assignment.lessonId);
                          const submission = mySubmissions[assignment._id];
                          const isSubmitted = submission?.status === 'Submitted' || submission?.status === 'Approved' || submission?.status === 'Reviewed';
                          const isDraft = submission?.status === 'Draft';
                          const needsRevision = submission?.status === 'Needs Revision';
                          const isApproved = submission?.status === 'Approved';
                          const isReviewed = submission?.status === 'Reviewed';
                          const isExpired = assignment.dueDate && new Date() > new Date(assignment.dueDate);

                          return (
                            <div key={assignment._id} className={`rounded-2xl border transition-all ${unlocked ? 'border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-slate-50' : 'border-slate-200 bg-slate-50/60 opacity-60'}`}>
                              {/* Card Header */}
                              <div className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${unlocked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                      {unlocked ? <ClipboardList size={18} /> : <Lock size={16} />}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-black text-slate-900 text-sm">{assignment.title}</h4>
                                        {!unlocked && <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">Locked</span>}
                                        {unlocked && isApproved && <span className="text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={9} /> Approved</span>}
                                        {unlocked && isReviewed && !isApproved && <span className="text-[9px] font-black uppercase tracking-widest text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Reviewed</span>}
                                        {unlocked && isSubmitted && !isApproved && !isReviewed && <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Submitted</span>}
                                        {unlocked && isDraft && <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Draft</span>}
                                        {unlocked && needsRevision && <span className="text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Needs Revision</span>}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="text-[10px] text-slate-500 font-medium">{assignment.minWords}–{assignment.maxWords} words</span>
                                        {assignment.dueDate && <span className={`text-[10px] font-medium flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-amber-600'}`}><Calendar size={10} /> Due: {new Date(assignment.dueDate).toLocaleDateString()} {isExpired ? '(Expired)' : ''}</span>}
                                        {submission?.wordCount && <span className="text-[10px] text-slate-400 font-medium">{submission.wordCount} words written</span>}
                                      </div>
                                    </div>
                                  </div>
                                  {unlocked && !isSubmitted && !isApproved && (
                                    <button
                                      onClick={() => openEssayEditor(assignment)}
                                      disabled={isExpired}
                                      className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${isExpired ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : isDraft ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}`}
                                    >
                                      <FileText size={11} />
                                      {isDraft ? 'Continue Essay' : 'Start Assignment'}
                                    </button>
                                  )}
                                  {unlocked && (isSubmitted || isApproved || isReviewed) && (
                                    <button
                                      onClick={() => openEssayEditor(assignment)}
                                      className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1.5"
                                    >
                                      <AlignJustify size={11} /> View Essay
                                    </button>
                                  )}
                                  {unlocked && needsRevision && (
                                    <button
                                      onClick={() => openEssayEditor(assignment)}
                                      className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 shadow-sm transition-all flex items-center gap-1.5"
                                    >
                                      <Edit2 size={11} /> Revise Essay
                                    </button>
                                  )}
                                </div>

                                {/* Locked state hint */}
                                {!unlocked && (
                                  <p className="text-[10px] text-slate-400 font-medium mt-3 ml-13 pl-0.5">
                                    Complete the preceding lesson to unlock this essay assignment.
                                  </p>
                                )}

                                {/* Submission feedback block */}
                                {submission?.adminFeedback && (
                                  <div className={`mt-4 p-4 rounded-xl border text-xs font-medium ${needsRevision ? 'bg-red-50 border-red-100 text-red-800' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                                    <p className="font-black uppercase tracking-widest text-[10px] mb-1">Admin Feedback</p>
                                    <p className="leading-relaxed">{submission.adminFeedback}</p>
                                    {submission.score != null && (
                                      <p className="mt-2 font-black text-indigo-700">Score: {submission.score} / 100</p>
                                    )}
                                    {submission.reviewedAt && (
                                      <p className="text-[10px] text-slate-400 mt-1">Reviewed: {new Date(submission.reviewedAt).toLocaleDateString()}</p>
                                    )}
                                  </div>
                                )}

                                {/* Submitted confirmation */}
                                {isSubmitted && !submission?.adminFeedback && (
                                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium flex items-center gap-2">
                                    <CheckCircle size={14} className="shrink-0" />
                                    <span>Submitted {submission?.submittedAt ? `on ${new Date(submission.submittedAt).toLocaleDateString()}` : ''} · {submission?.wordCount} words · Awaiting review</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>




              </div>

            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>

    {/* ── Essay Editor Full-Screen Modal ─────────────────────────────────── */}
    {essayOpen && (() => {
      const submission = mySubmissions[essayOpen._id];
      const isLocked = submission?.status === 'Submitted' || submission?.status === 'Approved' || submission?.status === 'Reviewed';
      const wordCount = countWords(essayText);
      const charCount = essayText.length;
      const readingTime = Math.ceil(wordCount / 200);
      const wordPct = Math.min((wordCount / essayOpen.maxWords) * 100, 100);
      const wordOk = wordCount >= essayOpen.minWords && wordCount <= essayOpen.maxWords;

      const applyFormat = (tag) => {
        const el = essayEditorRef.current;
        if (!el || isLocked) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = essayText.substring(start, end);
        let insert = '';
        if (tag === 'bold') insert = `**${selected || 'bold text'}**`;
        else if (tag === 'italic') insert = `_${selected || 'italic text'}_`;
        else if (tag === 'underline') insert = `<u>${selected || 'underline text'}</u>`;
        else if (tag === 'ul') insert = `\n• ${selected || 'list item'}\n`;
        else if (tag === 'ol') insert = `\n1. ${selected || 'list item'}\n`;
        const newText = essayText.substring(0, start) + insert + essayText.substring(end);
        setEssayText(newText);
        setTimeout(() => { el.selectionStart = start + insert.length; el.selectionEnd = start + insert.length; el.focus(); }, 0);
      };

      return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
          {/* Essay Editor TopBar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <ClipboardList size={16} className="text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-slate-900 text-sm truncate">{essayOpen.title}</h2>
                <p className="text-[10px] text-slate-400 font-medium">{selectedCourse?.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {essaySaving && <span className="text-[10px] text-slate-400 font-medium animate-pulse">Saving…</span>}
              {!isLocked && (
                <>
                  <button
                    onClick={() => saveEssayDraft(essayOpen, true)}
                    disabled={essaySaving}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
                  >
                    <Save size={13} /> Save Draft
                  </button>
                  <button
                    onClick={() => submitEssay(essayOpen)}
                    disabled={essaySubmitting || !wordOk}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm ${wordOk && !essaySubmitting ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    {essaySubmitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    Submit Assignment
                  </button>
                </>
              )}
              {isLocked && (
                <span className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle size={12} /> {submission?.status}
                </span>
              )}
              <button
                onClick={() => { setEssayOpen(null); if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); }}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Editor Column */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Formatting Toolbar */}
              {!isLocked && (
                <div className="flex items-center gap-1 px-6 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0 flex-wrap">
                  <button onClick={() => applyFormat('bold')} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-all" title="Bold"><Bold size={14} /></button>
                  <button onClick={() => applyFormat('italic')} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-all" title="Italic"><Italic size={14} /></button>
                  <button onClick={() => applyFormat('underline')} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-all" title="Underline"><Underline size={14} /></button>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <button onClick={() => applyFormat('ul')} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-all" title="Bullet List"><List size={14} /></button>
                  <button onClick={() => applyFormat('ol')} className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-all" title="Numbered List"><ListOrdered size={14} /></button>
                  <div className="ml-auto flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className={wordCount < essayOpen.minWords ? 'text-red-500' : wordCount > essayOpen.maxWords ? 'text-red-500' : 'text-green-600'}>
                      {wordCount} / {essayOpen.minWords} words min
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>{charCount} chars</span>
                    <span className="text-slate-300">|</span>
                    <span>~{readingTime} min read</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400">Autosave every 30s</span>
                  </div>
                </div>
              )}

              {/* Word count progress bar */}
              <div className="h-1 bg-slate-100 shrink-0">
                <div
                  className={`h-full transition-all duration-300 ${wordCount > essayOpen.maxWords ? 'bg-red-400' : wordCount >= essayOpen.minWords ? 'bg-green-400' : 'bg-indigo-400'}`}
                  style={{ width: `${wordPct}%` }}
                />
              </div>

              {/* Textarea */}
              <div className="flex-1 overflow-y-auto px-0 py-0">
                <textarea
                  ref={essayEditorRef}
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  readOnly={isLocked}
                  placeholder={isLocked ? '' : `Start writing your essay here...\n\nTip: Your work is automatically saved every 30 seconds.`}
                  className={`w-full h-full resize-none outline-none text-slate-800 text-base leading-relaxed font-normal px-16 py-10 ${isLocked ? 'bg-slate-50 text-slate-600 cursor-default' : 'bg-white'}`}
                  style={{ minHeight: '100%', fontFamily: "'Georgia', serif", fontSize: '16px', lineHeight: '1.85' }}
                />
              </div>
            </div>

            {/* Right Sidebar: Instructions + Stats */}
            <div className="w-72 border-l border-slate-200 bg-slate-50/80 flex flex-col shrink-0 overflow-y-auto">
              <div className="p-5 space-y-6">

                {/* Word Count Stats */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Progress</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Words</span>
                      <span className={wordCount < essayOpen.minWords ? 'text-amber-600' : wordCount > essayOpen.maxWords ? 'text-red-500' : 'text-green-600'}>{wordCount}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${wordCount > essayOpen.maxWords ? 'bg-red-400' : wordCount >= essayOpen.minWords ? 'bg-green-400' : 'bg-indigo-400'}`} style={{ width: `${wordPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Min: {essayOpen.minWords}</span>
                      <span>Max: {essayOpen.maxWords}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-slate-900">{charCount}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Chars</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-slate-900">{readingTime}m</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Read Time</p>
                    </div>
                  </div>
                  {!wordOk && !isLocked && (
                    <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-medium">
                      {wordCount < essayOpen.minWords
                        ? `Write ${essayOpen.minWords - wordCount} more words to meet the minimum.`
                        : `Reduce by ${wordCount - essayOpen.maxWords} words — you've exceeded the limit.`}
                    </div>
                  )}
                  {wordOk && !isLocked && (
                    <div className="mt-3 p-2.5 bg-green-50 border border-green-100 rounded-xl text-[10px] text-green-700 font-medium flex items-center gap-1.5">
                      <CheckCircle size={11} /> Word count is within range. Ready to submit!
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Instructions</p>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600 font-medium leading-relaxed max-h-72 overflow-y-auto">
                    {essayOpen.instructions}
                  </div>
                </div>

                {/* Due Date */}
                {essayOpen.dueDate && (
                  <div className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${new Date() > new Date(essayOpen.dueDate) ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                    <Calendar size={13} className="mt-0.5 shrink-0" />
                    <span>Due: <strong>{new Date(essayOpen.dueDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
                  </div>
                )}

                {/* Submission Details (if already submitted) */}
                {isLocked && submission && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Submission</p>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-medium text-slate-600">
                      <div className="flex justify-between"><span className="text-slate-400">Status</span><span className="font-black text-slate-900">{submission.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Words</span><span className="font-black">{submission.wordCount}</span></div>
                      {submission.submittedAt && <div className="flex justify-between"><span className="text-slate-400">Submitted</span><span>{new Date(submission.submittedAt).toLocaleDateString()}</span></div>}
                      {submission.score != null && <div className="flex justify-between"><span className="text-slate-400">Score</span><span className="font-black text-indigo-700">{submission.score}/100</span></div>}
                    </div>
                    {submission.adminFeedback && (
                      <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 font-medium">
                        <p className="font-black text-[10px] uppercase tracking-widest mb-1">Feedback</p>
                        {submission.adminFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
};

export default Courses;
