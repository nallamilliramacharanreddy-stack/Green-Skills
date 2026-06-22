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
  Pause, Volume2, VolumeX, Maximize, Minimize
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL, API_BASE_URL } from '../../utils/api';
import 'youtube-video-element';


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

  useEffect(() => {
    setVideoSourceIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [selectedCourse, activeLessonIndex]);

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
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('course_notes');
    try {
      return saved && saved !== 'undefined' ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse course_notes from localStorage:", e);
      localStorage.removeItem('course_notes');
      return {};
    }
  });
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
  }, []);

  const openCoursePlayer = (course) => {
    if (!course) return;

    // Auto-select first uncompleted lesson
    let nextIndex = 0;
    if (user && course.lessons) {
      const targetId = course._id.toString();
      const prog = user.progress?.courseProgress?.find(p => {
        const id = p.courseId?._id || p.courseId;
        return id && id.toString() === targetId;
      });

      const firstUncompleted = course.lessons.findIndex((_, idx) => {
        return !(prog?.completedLessons?.includes(idx));
      });

      if (firstUncompleted !== -1) {
        nextIndex = firstUncompleted;
      }
    }

    setActiveLessonIndex(nextIndex);
    setSelectedCourse(course);
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

  const handleProgress = (state) => {
    if (!playerRef.current) return;
    const currentPlayed = state.playedSeconds;
    if (currentPlayed > maxPlayed + 2) {
      // User tried to fast-forward, revert to maxPlayed
      playerRef.current.seekTo(maxPlayed, 'seconds');
    } else {
      setMaxPlayed(Math.max(maxPlayed, currentPlayed));
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
      toast.error('Please complete the current video data first');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/courses/${courseId}/complete-lesson`, { userId: user._id, lessonIndex });
      updateUser(res.data.user);
      toast.success(`Lesson ${lessonIndex + 1} synchronized`);

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
      toast.error('Lesson sync failed');
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

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
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

        {/* Course Player Modal */}
        <AnimatePresence>
          {selectedCourse && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCourse(null)}
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="relative bg-white w-full max-w-6xl h-[90vh] overflow-hidden rounded-[64px] shadow-2xl flex flex-col md:flex-row border border-white/10"
              >
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-8 right-8 z-10 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-primary transition-all"
                >
                  <X size={24} />
                </button>

                {/* Video Column */}
                <div className="flex-1 bg-slate-50 flex flex-col relative overflow-y-auto border-r border-slate-100">
                  <div 
                    ref={playerContainerRef}
                    onMouseMove={handleMouseMove}
                    className="w-full aspect-video bg-black flex items-center justify-center sticky top-0 z-20 overflow-hidden group"
                  >
                    {selectedCourse.lessons && selectedCourse.lessons[activeLessonIndex] ? (
                      (() => {
                        const lesson = selectedCourse.lessons[activeLessonIndex];
                        let internalUrl = lesson.internalVideoUrl || lesson.directVideoUrl;
                        const hasTranslations = lesson.audioTracks && lesson.audioTracks.length > 0;

                        let ytVideoId = '';
                        if (lesson.youtubeLink) {
                          const watchMatch = lesson.youtubeLink.match(/[?&]v=([^&#]+)/);
                          const shortMatch = lesson.youtubeLink.match(/youtu\.be\/([^?&#]+)/);
                          const embedMatch = lesson.youtubeLink.match(/youtube\.com\/embed\/([^?&#]+)/);
                          if (watchMatch) ytVideoId = watchMatch[1];
                          else if (shortMatch) ytVideoId = shortMatch[1];
                          else if (embedMatch) ytVideoId = embedMatch[1];
                        }

                        let playMode = 'native';
                        let sourceUrl = '';

                        if (videoSourceIndex === 0) {
                          if (internalUrl) {
                            sourceUrl = getVideoUrl(internalUrl);
                          } else if (ytVideoId) {
                            sourceUrl = `${API_URL}/videos/stream-live/${ytVideoId}`;
                          } else {
                            playMode = 'youtube';
                          }
                        } else if (videoSourceIndex === 1) {
                          if (ytVideoId) {
                            sourceUrl = `http://localhost:5001/api/videos/stream-live/${ytVideoId}`;
                          } else {
                            playMode = 'youtube';
                          }
                        } else {
                          playMode = 'youtube';
                        }

                        return (
                          <div className="w-full h-full relative flex items-center justify-center">
                            {/* 1. Youtube Video Element */}
                            {playMode === 'youtube' && lesson.youtubeLink ? (
                              <youtube-video
                                ref={videoRef}
                                id={`video-${lesson._id}`}
                                className="w-full h-full aspect-video object-contain pointer-events-none"
                                src={lesson.youtubeLink}
                                playsInline
                                autoPlay
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                                onDurationChange={(e) => setDuration(e.target.duration)}
                                onEnded={() => {
                                  setLessonWatched(true);
                                  handleCompleteLesson(selectedCourse._id, activeLessonIndex);
                                }}
                              />
                            ) : playMode === 'native' && sourceUrl ? (
                              /* 2. Native HTML5 Video Element */
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
                                src={sourceUrl}
                                onError={() => {
                                  console.log(`Failed to load native stream URL: ${sourceUrl} (index: ${videoSourceIndex})`);
                                  if (videoSourceIndex === 0 && !API_URL.includes('localhost') && !API_URL.includes('127.0.0.1')) {
                                    setVideoSourceIndex(1); // Try local backend proxy
                                  } else {
                                    setVideoSourceIndex(2); // Fallback to YouTube player
                                  }
                                }}
                                onPlay={(e) => {
                                  setIsPlaying(true);
                                  // Sync alternative audio track if selected
                                  const audioEl = document.getElementById(`audio-${lesson._id}`);
                                  if (audioEl) {
                                    audioEl.currentTime = e.target.currentTime;
                                    audioEl.play().catch(() => { });
                                    e.target.muted = true;
                                  } else {
                                    e.target.muted = isMuted;
                                  }
                                }}
                                onPause={(e) => {
                                  setIsPlaying(false);
                                  const audioEl = document.getElementById(`audio-${lesson._id}`);
                                  if (audioEl) audioEl.pause();
                                }}
                                onTimeUpdate={(e) => {
                                  setCurrentTime(e.target.currentTime);
                                }}
                                onDurationChange={(e) => {
                                  setDuration(e.target.duration);
                                }}
                                onEnded={() => {
                                  setLessonWatched(true);
                                  handleCompleteLesson(selectedCourse._id, activeLessonIndex);
                                }}
                              >
                                {lesson.subtitles && lesson.subtitles.map((sub, i) => (
                                  <track key={i} kind="subtitles" src={sub.url} srcLang={sub.languageCode} label={sub.language} />
                                ))}
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              /* 3. Unavailable */
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-10 text-center">
                                <Video size={48} className="mb-4 opacity-50 text-white" />
                                <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Video Unavailable</h3>
                                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">The instructor hasn't provided a valid video link for this lesson.</p>
                              </div>
                            )}

                            {/* Unified Premium Controls Overlay */}
                            {playMode !== 'none' && (sourceUrl || (playMode === 'youtube' && lesson.youtubeLink)) && (
                              <div 
                                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 z-30 transition-opacity duration-300 pointer-events-none ${
                                  showControls ? 'opacity-100' : 'opacity-0'
                                }`}
                              >
                                {/* Progress bar container */}
                                <div className="w-full flex items-center gap-3 mb-4 pointer-events-auto group/timeline">
                                  <span className="text-[10px] font-mono text-white/70 font-bold">{formatTime(currentTime)}</span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="flex-1 h-1.5 rounded-full appearance-none bg-white/20 outline-none cursor-pointer accent-primary hover:h-2 transition-all"
                                    style={{
                                      background: `linear-gradient(to right, #10B981 0%, #10B981 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                                    }}
                                  />
                                  <span className="text-[10px] font-mono text-white/70 font-bold">{formatTime(duration)}</span>
                                </div>

                                {/* Controls buttons and selectors */}
                                <div className="flex items-center justify-between pointer-events-auto">
                                  <div className="flex items-center gap-6">
                                    {/* Play/Pause */}
                                    <button
                                      onClick={handlePlayPause}
                                      className="text-white hover:text-primary transition-colors focus:outline-none"
                                    >
                                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                    </button>

                                    {/* Volume */}
                                    <div className="flex items-center gap-2 group/volume">
                                      <button
                                        onClick={handleMuteToggle}
                                        className="text-white hover:text-primary transition-colors focus:outline-none"
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
                                        className="w-0 overflow-hidden group-hover/volume:w-20 accent-primary h-1 bg-white/20 rounded-full appearance-none outline-none transition-all duration-300"
                                        style={{
                                          background: `linear-gradient(to right, #10B981 0%, #10B981 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-6">
                                    {/* Subtitles (Only if subtitles exist) */}
                                    {lesson.subtitles && lesson.subtitles.length > 0 && (
                                      <div className="relative group/sub">
                                        <button className="text-white hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider">
                                          CC
                                        </button>
                                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover/sub:block bg-slate-950/90 border border-white/10 rounded-xl p-2 min-w-[120px] shadow-2xl">
                                          <button
                                            onClick={() => {
                                              if (videoRef.current) {
                                                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                                                  videoRef.current.textTracks[i].mode = 'disabled';
                                                }
                                              }
                                              setActiveSubLang('none');
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-[10px] font-bold rounded-lg ${
                                              activeSubLang === 'none' ? 'text-primary bg-white/5' : 'text-white hover:bg-white/5'
                                            }`}
                                          >
                                            Off
                                          </button>
                                          {lesson.subtitles.map((sub, i) => (
                                            <button
                                              key={i}
                                              onClick={() => {
                                                if (videoRef.current) {
                                                  for (let j = 0; j < videoRef.current.textTracks.length; j++) {
                                                    if (videoRef.current.textTracks[j].language === sub.languageCode) {
                                                      videoRef.current.textTracks[j].mode = 'showing';
                                                    } else {
                                                      videoRef.current.textTracks[j].mode = 'disabled';
                                                    }
                                                  }
                                                }
                                                setActiveSubLang(sub.languageCode);
                                              }}
                                              className={`w-full text-left px-3 py-1.5 text-[10px] font-bold rounded-lg ${
                                                activeSubLang === sub.languageCode ? 'text-primary bg-white/5' : 'text-white hover:bg-white/5'
                                              }`}
                                            >
                                              {sub.language}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* AI Translation Overlay Controls */}
                                    {hasTranslations && (
                                      <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors text-white text-xs font-bold">
                                        <Globe size={14} className="text-primary" />
                                        <select
                                          className="bg-transparent outline-none border-none cursor-pointer text-white"
                                          onChange={(e) => {
                                            const lang = e.target.value;
                                            const videoEl = videoRef.current;
                                            let audioEl = document.getElementById(`audio-${lesson._id}`);

                                            if (lang === 'en') {
                                              if (audioEl) {
                                                audioEl.pause();
                                                audioEl.remove();
                                              }
                                              if (videoEl) videoEl.muted = isMuted;
                                            } else {
                                              const track = lesson.audioTracks.find(t => t.languageCode === lang);
                                              if (track && videoEl) {
                                                if (!audioEl) {
                                                  audioEl = document.createElement('audio');
                                                  audioEl.id = `audio-${lesson._id}`;
                                                  document.body.appendChild(audioEl);
                                                }
                                                audioEl.src = track.url;
                                                audioEl.currentTime = videoEl.currentTime;
                                                videoEl.muted = true;
                                                if (!videoEl.paused) audioEl.play().catch(() => {});
                                              }
                                            }
                                          }}
                                        >
                                          <option value="en" className="bg-slate-900 text-white">English (Original)</option>
                                          {lesson.audioTracks.map((t, i) => (
                                            <option key={i} value={t.languageCode} className="bg-slate-900 text-white">{t.language} (AI Dub)</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    {/* Fullscreen Toggle */}
                                    <button
                                      onClick={handleFullscreenToggle}
                                      className="text-white hover:text-primary transition-colors focus:outline-none"
                                    >
                                      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
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

                  {/* Lesson Controls */}
                  <div className="p-8 bg-white flex justify-between items-center border-b border-slate-100 shadow-sm relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Playing Lesson {activeLessonIndex + 1}</p>
                      <h4 className="text-slate-900 font-bold uppercase italic text-lg">{selectedCourse.lessons?.[activeLessonIndex]?.title || 'Untitled Lesson'}</h4>
                    </div>
                    <div className="flex gap-4">
                      {/* Show Take Quiz if lesson has quiz or if watched */}
                      {selectedCourse.lessons?.[activeLessonIndex]?.quiz?.length > 0 && (
                        <button
                          onClick={() => {
                            const lesson = selectedCourse.lessons[activeLessonIndex];
                            navigate('/dashboard/quiz', {
                              state: {
                                activeQuiz: {
                                  _id: selectedCourse._id,
                                  lessonIndex: activeLessonIndex,
                                  title: `Assessment: ${lesson.title}`,
                                  quiz: lesson.quiz
                                }
                              }
                            });
                          }}
                          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                        >
                          <Award size={14} className="text-yellow-400" /> Take Assessment
                        </button>
                      )}

                      <button
                        onClick={() => handleCompleteLesson(selectedCourse._id, activeLessonIndex)}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                      >
                        {isLessonCompleted(selectedCourse._id, activeLessonIndex) ? 'Lesson Completed' : 'Mark as Watched'}
                      </button>
                    </div>
                  </div>

                  {/* Notes Section Below Video */}
                  <div className="p-8 max-w-4xl w-full mx-auto space-y-6">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-primary" /> Personal Course Notes
                    </h4>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Write a note for this course..."
                        className="w-full h-24 bg-slate-50 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 resize-none"
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => {
                            if (!noteInput.trim()) return;
                            const courseId = selectedCourse._id;
                            const courseNotes = notes[courseId] || [];
                            let newNotesMap;
                            if (editingNoteId) {
                              newNotesMap = {
                                ...notes,
                                [courseId]: courseNotes.map(n => n.id === editingNoteId ? { ...n, text: noteInput } : n)
                              };
                              setEditingNoteId(null);
                              toast.success('Note updated');
                            } else {
                              newNotesMap = {
                                ...notes,
                                [courseId]: [...courseNotes, { id: Date.now(), text: noteInput }]
                              };
                              toast.success('Note saved');
                            }
                            setNotes(newNotesMap);
                            localStorage.setItem('course_notes', JSON.stringify(newNotesMap));
                            setNoteInput('');
                          }}
                          className="px-6 py-2 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-md flex items-center gap-2"
                        >
                          <Save size={14} /> {editingNoteId ? 'Update Note' : 'Save Note'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pb-12">
                      {(notes[selectedCourse._id] || []).length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                          <FileText size={32} className="mx-auto mb-2 text-slate-400" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No notes yet</p>
                        </div>
                      ) : (
                        (notes[selectedCourse._id] || []).map((note) => (
                          <div key={note.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm relative group">
                            <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap pr-12">{note.text}</p>
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setNoteInput(note.text);
                                  setEditingNoteId(note.id);
                                  // Scroll slightly up towards the text area
                                  document.querySelector('.flex-1.bg-slate-50.overflow-y-auto').scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                                className="p-1.5 text-slate-400 hover:text-primary bg-slate-50 hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const courseId = selectedCourse._id;
                                  const courseNotes = notes[courseId] || [];
                                  const newNotesMap = { ...notes, [courseId]: courseNotes.filter(n => n.id !== note.id) };
                                  setNotes(newNotesMap);
                                  localStorage.setItem('course_notes', JSON.stringify(newNotesMap));
                                  toast.success('Note deleted');
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Column */}
                <div className="w-full md:w-[450px] bg-slate-50 flex flex-col border-l border-slate-100 overflow-y-auto">
                  <div className="p-8 border-b border-slate-200 bg-white sticky top-0 z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">{selectedCourse.category}</span>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none mt-1">{selectedCourse.title}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                        <p className="text-xl font-black text-slate-900">{getCourseProgress(selectedCourse)}%</p>
                      </div>
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                      <button
                        onClick={() => setPlayerTab('lessons')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${playerTab === 'lessons' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                      >
                        Lessons ({selectedCourse.lessons?.length || 0})
                      </button>
                      <button
                        onClick={() => setPlayerTab('tasks')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${playerTab === 'tasks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                      >
                        Tasks ({selectedCourse.tasks?.length || 0})
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-6 space-y-4">
                    {playerTab === 'lessons' ? (
                      Object.entries(
                        selectedCourse.lessons?.reduce((acc, lesson, idx) => {
                          const mTitle = lesson.moduleTitle || 'Uncategorized';
                          if (!acc[mTitle]) acc[mTitle] = [];
                          acc[mTitle].push({ lesson, idx });
                          return acc;
                        }, {}) || {}
                      ).map(([moduleTitle, moduleVideos], groupIdx) => (
                        <div key={groupIdx} className="mb-8 last:mb-0">
                          <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">{groupIdx + 1}</span>
                            {moduleTitle}
                          </h6>
                          <div className="space-y-3">
                            {moduleVideos.map(({ lesson, idx }) => {
                              const locked = isLessonLocked(selectedCourse._id, idx);
                              const completed = isLessonCompleted(selectedCourse._id, idx);

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
                                  className={`p-4 rounded-[20px] border transition-all cursor-pointer flex items-center gap-4 group ${activeLessonIndex === idx
                                    ? 'bg-white border-primary shadow-xl shadow-primary/5'
                                    : locked ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                                    }`}
                                >
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeLessonIndex === idx ? 'bg-primary text-white' :
                                    completed ? 'bg-primary text-white' :
                                      locked ? 'bg-slate-200 text-slate-400' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'
                                    }`}>
                                    {completed ? <CheckCircle size={18} /> :
                                      locked ? <Lock size={16} /> : <Play size={16} />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className={`text-[10px] font-black uppercase tracking-widest ${activeLessonIndex === idx ? 'text-primary' : 'text-slate-400'}`}>
                                        Video {lesson.title.replace('Video ', '')}
                                      </p>
                                      {locked && <Lock size={10} className="text-slate-300" />}
                                    </div>
                                    <p className={`font-bold text-sm uppercase ${activeLessonIndex === idx ? 'text-slate-900' : 'text-slate-600'}`}>{lesson.title}</p>
                                  </div>
                                  <span className="text-[10px] font-black text-slate-300 uppercase">{lesson.duration}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : playerTab === 'tasks' ? (
                      selectedCourse.tasks?.map((task, idx) => (
                        <div
                          key={idx}
                          className={`p-6 rounded-[32px] border transition-all bg-white flex items-start gap-5 ${isTaskCompleted(selectedCourse._id, idx) ? 'border-primary/20 bg-primary/5' : 'border-slate-100 shadow-sm'
                            }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isTaskCompleted(selectedCourse._id, idx) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                            <BookOpen size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industrial Task {idx + 1}</p>
                              {isTaskCompleted(selectedCourse._id, idx) && <span className="text-[9px] font-black text-primary uppercase tracking-widest italic flex items-center gap-1"><CheckCircle size={10} /> Verified</span>}
                            </div>
                            <p className="font-black text-slate-900 uppercase italic text-lg leading-none mb-2">{task.title}</p>
                            <p className="text-xs text-slate-500 font-medium mb-6">{task.description}</p>
                            <button
                              onClick={() => handleCompleteTask(selectedCourse._id, idx)}
                              disabled={isTaskCompleted(selectedCourse._id, idx)}
                              className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isTaskCompleted(selectedCourse._id, idx)
                                ? 'bg-primary/20 text-primary cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-primary shadow-lg'
                                }`}
                            >
                              {isTaskCompleted(selectedCourse._id, idx) ? 'Task Submitted' : 'Submit Assignment'}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : null}
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 sticky bottom-0">
                    <button
                      onClick={() => handleCompleteCourse(selectedCourse._id)}
                      disabled={getCourseProgress(selectedCourse) < 100}
                      className={`w-full py-5 rounded-[24px] font-black uppercase tracking-tighter text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${getCourseProgress(selectedCourse) >= 100
                        ? 'bg-primary text-white hover:scale-[1.02] shadow-primary/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      <Award size={20} />
                      {getCourseProgress(selectedCourse) >= 100 ? 'Course Completed' : `Graduate Node (${getCourseProgress(selectedCourse)}%)`}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Courses;
