import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, BookOpen, Award, CheckCircle, Clock,
  ArrowRight, Target, Zap, Shield, Flame, PlayCircle, Trophy, Sparkles, TrendingUp, Hexagon, Activity, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStreak } from '../../context/StreakContext';
import { API_URL } from '../../utils/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { leaderboard, streakData, setShowHub } = useStreak() || {};
  const [lastAttempt, setLastAttempt] = useState(null);

  const myRank = leaderboard && user 
    ? leaderboard.findIndex(item => {
        const id = item.userId?._id || item.userId;
        const myId = user.id || user._id;
        return id && myId && id.toString() === myId.toString();
      }) + 1
    : 0;

  useEffect(() => {
    const currentUserId = user?.id || user?._id;
    if (!currentUserId) return;

    // 1. Instantly render from localStorage cache
    const cacheKey = `lastAttempt_${currentUserId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setLastAttempt(JSON.parse(cached));
      }
    } catch (_) { }

    // 2. Fetch fresh data from the new fast endpoint in background
    const fetchLastAttempt = async () => {
      try {
        const res = await axios.get(`${API_URL}/quizzes/results/latest`, {
          params: { userId: currentUserId }
        });
        if (res.data) {
          setLastAttempt(res.data);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(res.data));
          } catch (_) { }
        }
      } catch (err) {
        console.error("Failed to load last attempt:", err);
      }
    };
    fetchLastAttempt();
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super-admin' || user?.role?.startsWith('admin_')) {
      navigate('/admin', { replace: true });
    } else if (user?.role === 'employer') {
      navigate('/employer', { replace: true });
    } else if (user?.role === 'guide') {
      navigate('/guide', { replace: true });
    } else if (user?.role === 'support') {
      navigate('/support', { replace: true });
    }
  }, [user, navigate]);

  const getCourseProgress = (course) => {
    if (!user || !course) return 0;
    const targetId = (course._id || course).toString();
    const prog = user.progress?.courseProgress?.find(p => {
      const id = p.courseId?._id || p.courseId;
      return id && id.toString() === targetId;
    });

    if (!prog) {
      const isCompleted = user.progress?.completedCourses?.some(c => (c?._id || c).toString() === targetId);
      return isCompleted ? 100 : 0;
    }

    const totalLessons = course.lessons?.length || 0;
    const totalTasks = course.tasks?.length || 0;
    const totalItems = totalLessons + totalTasks;
    if (totalItems === 0) {
      const isCompleted = user.progress?.completedCourses?.some(c => (c?._id || c).toString() === targetId);
      return isCompleted ? 100 : 0;
    }

    // Filter unique completed items that actually exist in the current course
    const completedLessonsCount = [...new Set(prog.completedLessons || [])]
      .filter(idx => idx >= 0 && idx < totalLessons).length;
    const completedTasksCount = [...new Set(prog.completedTasks || [])]
      .filter(idx => idx >= 0 && idx < totalTasks).length;

    const completedItems = completedLessonsCount + completedTasksCount;
    const percentage = Math.round((completedItems / totalItems) * 100);
    return Math.min(percentage, 100);
  };

  const activeCourse = user?.progress?.currentCourses?.[0];
  const activeCourseProgress = activeCourse ? getCourseProgress(activeCourse) : 0;
  const completedCount = user?.progress?.completedCourses?.length || 0;

  return (
    <DashboardLayout role="student">
      <div className="relative min-h-[90vh] bg-slate-950 overflow-hidden rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] m-4 md:m-8 border border-white/5">

        {/* Holographic Orbs Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-fuchsia-600/20 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[10000ms]"></div>
          <div className="absolute top-[30%] -right-[20%] w-[60%] h-[60%] bg-violet-600/20 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[12000ms]"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-cyan-600/20 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[14000ms]"></div>
          {/* Subtle noise texture to make it feel like real glass */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-30 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 p-8 lg:p-12 h-full flex flex-col xl:flex-row gap-8">

          {/* LEFT COLUMN: Identity Passport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="xl:w-1/3 flex flex-col gap-6"
          >
            {/* Vision Glass User Card */}
            <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[2rem] p-8 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:bg-white/[0.05] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-2xl p-[1px] shadow-[0_0_30px_rgba(217,70,239,0.3)]">
                    <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[15px] flex items-center justify-center overflow-hidden">
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" />
                      ) : (
                        <span className="text-3xl font-light text-fuchsia-300">{user?.name?.[0]}</span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center border border-white/20 shadow-xl">
                    <Sparkles size={14} className="text-cyan-300" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white tracking-tight mb-1">
                    {user?.name || 'User'}
                  </h2>
                </div>
              </div>

              {/* Dynamic Eco-Sync HUD Card */}
              <div className="relative z-10 bg-slate-950/60 border border-white/10 rounded-[1.5rem] p-6 shadow-2xl overflow-hidden group/hud">
                {/* Micro background grid/glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 opacity-60 pointer-events-none"></div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    PROGRESS
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                    <Flame size={16} className="fill-orange-400 animate-bounce" />
                    <span>{streakData?.currentStreak || 0} Day Streak</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Modules & Hours compact status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between min-h-[90px] hover:bg-white/[0.04] transition-all duration-300">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <CheckCircle size={16} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                      </div>
                      <span className="text-lg font-bold text-white tracking-tight mt-3">{completedCount} Modules</span>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between min-h-[90px] hover:bg-white/[0.04] transition-all duration-300">
                      <div className="flex items-center gap-2 text-fuchsia-400">
                        <Clock size={16} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Spent</span>
                      </div>
                      <span className="text-lg font-bold text-white tracking-tight mt-3">{completedCount * 2} Hours</span>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => navigate('/dashboard/profile')} className="w-full mt-8 py-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-[10px] font-semibold text-white uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 backdrop-blur-md">
                Open Profile <ArrowRight size={14} />
              </button>
            </div>

            {/* Quick Actions Hologram */}
            <div className="bg-gradient-to-br from-fuchsia-600/80 to-violet-900/80 backdrop-blur-[40px] rounded-[2rem] p-8 border border-white/20 shadow-[0_20px_50px_rgba(147,51,234,0.3)] flex-1 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80')] bg-cover opacity-10 mix-blend-overlay pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center mb-6 border border-white/30 shadow-lg">
                  <Hexagon size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-medium text-white tracking-tight mb-2 drop-shadow-md">Your Performance</h3>
                {lastAttempt ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-4 space-y-2">
                    <p className="text-[10px] text-fuchsia-200 font-bold uppercase tracking-widest">Previous Quiz Performance</p>
                    <p className="text-xs font-black text-white truncate">{lastAttempt.course?.title || lastAttempt.quizTitle || 'Solar panel certification'}</p>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                      <span className="text-slate-300">Marks: <strong className="text-cyan-300">{lastAttempt.score} / {lastAttempt.totalQuestions}</strong></span>
                      <span className={`px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase ${lastAttempt.status === 'Pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>{lastAttempt.status || 'Fail'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-fuchsia-100/80 mb-8 leading-relaxed">
                    Access multidimensional training spaces and AI-generated career trajectories.
                  </p>
                )}
              </div>
              <button onClick={() => navigate('/dashboard/quiz')} className="relative z-10 w-full py-4 bg-white text-fuchsia-900 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform">
                {lastAttempt ? 'Enter Assessment Hub' : 'Initialize Matrix'}
              </button>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Holographic Modules */}
          <div className="xl:w-2/3 flex flex-col gap-6">

            {/* Mega Active Course HUD */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-auto md:h-[400px] bg-white/[0.02] backdrop-blur-[40px] rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row group"
            >
              {/* Visual/Energy Side */}
              <div className="md:w-1/2 relative overflow-hidden min-h-[250px] md:min-h-full flex items-center justify-center border-r border-white/5">
                {/* Ethereal Abstract Image */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-screen group-hover:scale-110 group-hover:opacity-40 transition-all duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent md:bg-gradient-to-l"></div>

                {/* Holographic Progress Ring */}
                {activeCourse && (
                  <div className="relative z-10 w-48 h-48 backdrop-blur-md bg-white/5 rounded-full border border-white/10 shadow-2xl flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90 p-4" viewBox="0 0 100 100">
                      {/* Background track */}
                      <circle cx="50" cy="50" r="46" className="stroke-white/10 fill-none" strokeWidth="2" />
                      {/* Animated progress track */}
                      <motion.circle
                        cx="50" cy="50" r="46"
                        className="stroke-cyan-400 fill-none drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 289" }}
                        animate={{ strokeDasharray: `${(activeCourseProgress / 100) * 289} 289` }}
                        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-light text-white tracking-tighter drop-shadow-lg">{activeCourseProgress}%</span>
                      <span className="text-[8px] font-medium text-cyan-300 uppercase tracking-widest mt-1">Rendered</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Side */}
              <div className="md:w-1/2 p-10 md:p-14 flex flex-col justify-center relative bg-gradient-to-br from-white/[0.05] to-transparent">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-8 w-max shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                  <Activity size={12} className="text-cyan-400 animate-pulse" />
                  <span className="text-[9px] font-semibold text-cyan-400 uppercase tracking-widest">Live Session</span>
                </div>

                <h3 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-[1.1] mb-4 drop-shadow-md">
                  {activeCourse ? activeCourse.title : "SYSTEM IDLE"}
                </h3>

                <p className="text-sm font-medium text-slate-400 mb-10 max-w-sm leading-relaxed">
                  {activeCourse
                    ? `You are currently rendering the ${activeCourse.category} module. Continue synchronization to master this matrix.`
                    : "No active modules detected. Initialize a learning sequence from the Knowledge Base."}
                </p>

                {activeCourse ? (
                  <button
                    onClick={() => navigate('/dashboard/courses', { state: { openCourse: activeCourse._id } })}
                    className="group/btn relative px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl text-white rounded-xl font-semibold uppercase text-[10px] tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all w-max flex items-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative z-10 flex items-center gap-3">Resume Sync <Play size={14} className="fill-white" /></span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/dashboard/courses')}
                    className="px-8 py-4 bg-white text-slate-950 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-slate-200 transition-colors w-max"
                  >
                    Browse Directory
                  </button>
                )}
              </div>
            </motion.div>

            {/* Bottom Row: Roadmap & Next Steps */}
            <div className="flex flex-col md:flex-row gap-6 flex-1">

              {/* Trajectory Module */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="md:w-1/2 bg-white/[0.02] backdrop-blur-[40px] rounded-[2rem] p-8 border border-white/10 flex flex-col relative overflow-hidden group hover:bg-white/[0.04] transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <h3 className="text-xl font-medium text-white tracking-tight">AI Roadmap</h3>
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <TrendingUp className="text-fuchsia-400" size={18} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-6 relative z-10">
                  {[
                    { title: "Digital Core", status: "Rendered", color: "text-violet-400", dot: "bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.6)]", line: "bg-violet-500/30" },
                    { title: "Advanced Matrix", status: "Syncing", color: "text-cyan-400", dot: "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]", line: "bg-white/10" },
                    { title: "Master Protocol", status: "Encrypted", color: "text-slate-600", dot: "bg-slate-800 border border-slate-600", line: "bg-transparent" }
                  ].map((node, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      {idx !== 2 && <div className={`absolute top-6 left-1.5 w-[2px] h-10 ${node.line}`}></div>}
                      <div className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 relative z-10 ${node.dot}`}></div>
                      <div>
                        <h4 className={`text-sm font-semibold tracking-tight ${node.status === 'Encrypted' ? 'text-slate-500' : 'text-white'}`}>{node.title}</h4>
                        <p className={`text-[9px] font-medium uppercase tracking-[0.2em] mt-1 ${node.color}`}>{node.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Leaderboard Module */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="md:w-1/2 bg-white/[0.02] backdrop-blur-[40px] rounded-[2rem] p-8 border border-white/10 flex flex-col relative overflow-hidden group hover:bg-white/[0.04] transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              >
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none"></div>

                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-medium text-white tracking-tight mb-1">Leader Board</h3>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Top Active Learners</p>
                  </div>
                  <button
                    onClick={() => setShowHub && setShowHub(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer group/btn"
                  >
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">View All</span>
                    <Trophy className="text-cyan-300 group-hover/btn:scale-110 transition-transform" size={14} strokeWidth={2} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-4 relative z-10 justify-center">
                  {leaderboard && leaderboard.length > 0 ? leaderboard.slice(0, 3).map((lUser, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <div
                        key={lUser._id || idx}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] backdrop-blur-md ${isFirst ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        {/* Rank & Crown */}
                        <div className="relative flex flex-col items-center justify-center w-8">
                          {isFirst && <div className="absolute -top-5 text-amber-400 animate-pulse"><Trophy size={16} /></div>}
                          <span className={`font-black text-xl ${isFirst ? 'text-amber-400' : 'text-slate-500'}`}>
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 ${isFirst ? 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border-slate-600'}`}>
                          {lUser.profilePicture ? (
                            <img src={lUser.profilePicture} alt={lUser.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white bg-slate-800">
                              {lUser.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-white tracking-tight truncate">{lUser.name}</h4>
                          <p className={`text-[10px] font-medium uppercase tracking-widest flex items-center gap-1 mt-1 ${isFirst ? 'text-amber-300' : 'text-fuchsia-300'}`}>
                            <Flame size={12} className={isFirst ? 'text-amber-400' : 'text-fuchsia-400'} /> {lUser.ultraStreak?.currentStreak || 0} Sync
                          </p>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <span className={`text-xl font-black tracking-tight ${isFirst ? 'text-amber-400' : 'text-cyan-400'} drop-shadow-md`}>
                            {lUser.ultraStreak?.leaderboardPoints || 0}
                          </span>
                          <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">PTS</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-white/5 rounded-2xl bg-white/[0.02]">
                      <Activity size={24} className="text-slate-500 mb-3" />
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">No signals detected</p>
                    </div>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
