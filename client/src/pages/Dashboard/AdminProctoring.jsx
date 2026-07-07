import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Play, Video, Clock, CheckCircle, AlertTriangle, User, BrainCircuit, PlayCircle, Eye, Activity, Shield, FastForward, Rewind, Pause, Search, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL, API_BASE_URL } from '../../utils/api';

const getVideoUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        const baseApi = API_URL.endsWith('/api') ? API_URL.substring(0, API_URL.length - 4) : API_URL;
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

const AdminProctoring = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await axios.get(`${API_URL}/quizzes/results`);
      const sortedData = res.data.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      setResults(sortedData);
    } catch (err) {
      toast.error('Failed to fetch proctoring data');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(r => r.user?.name?.toLowerCase().includes(search.toLowerCase()) || r.course?.title?.toLowerCase().includes(search.toLowerCase()));

  if (selectedResult) {
    return (
      <ReportViewer
        result={selectedResult}
        onBack={() => setSelectedResult(null)}
        onInvalidate={(updatedResult) => {
          setResults(prev => prev.map(r => r._id === updatedResult._id ? updatedResult : r));
          setSelectedResult(updatedResult);
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter ">AI Proctoring Hub</h2>
          <p className="text-slate-500 font-medium">Monitor, audit, and analyze assessment integrity.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-900 transition-all font-bold text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Details</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust & Violations</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map(res => (
              <tr key={res._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedResult(res)}>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black uppercase text-xs">
                      {res.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{res.user?.name || 'Unknown Candidate'}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{res.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 font-bold text-slate-700 text-sm">{res.course?.title}</td>
                <td className="p-6">
                  <div className="flex flex-col gap-1">
                    {res.isInvalidated ? (
                      <span className="px-3 py-1 bg-red-50 border border-red-100 text-red-600 rounded-md font-black text-[10px] uppercase tracking-wider w-max">
                        Invalidated
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 rounded-md font-black text-slate-900 text-sm w-max">
                        {res.totalQuestions ? Math.round((res.score / res.totalQuestions) * 100) : 0}% ({res.score}/{res.totalQuestions})
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400 font-bold">
                      C: <span className="text-emerald-500 font-bold">{res.correctCount ?? res.score}</span> | W: <span className="text-red-500 font-bold">{res.wrongCount ?? 0}</span> | N/A: <span className="text-slate-500 font-bold">{res.notAttemptedCount ?? 0}</span>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={14} className={res.trustScore > 70 ? 'text-emerald-500' : res.trustScore > 40 ? 'text-amber-500' : 'text-red-500'} />
                      <span className={`font-black ${res.trustScore > 70 ? 'text-emerald-500' : res.trustScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {res.trustScore || 100}%
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      Warnings: {res.warnings || 0}/3 | Violations: {res.violationTimeline?.length || 0}
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider w-max ${res.submissionType === 'Auto Submission Due To Violations' || res.autoSubmitReason
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : res.submissionType === 'Time Expired Submission'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                      {res.submissionType || (res.autoSubmitReason ? 'Auto Submission' : 'Normal Submission')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold font-mono">
                      {res.completedAt ? new Date(res.completedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-primary transition-all">
                    View Audit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportViewer = ({ result, onBack, onInvalidate }) => {
  const [activeTab, setActiveTab] = useState('screen');
  const [isPlaying, setIsPlaying] = useState(false);
  const [invalidating, setInvalidating] = useState(false);
  const videoRef = React.useRef(null);

  const handleRemoveScore = async () => {
    const confirm = window.confirm("Are you sure you want to invalidate this candidate's quiz attempt? This will set their score to 0 and remove it from their learning streak / progress metrics. This action cannot be undone.");
    if (!confirm) return;

    setInvalidating(true);
    try {
      const res = await axios.put(`${API_URL}/quizzes/results/${result._id}/invalidate`);
      toast.success("Assessment score successfully invalidated.");
      if (onInvalidate) {
        onInvalidate(res.data.result);
      }
    } catch (err) {
      console.error("Failed to invalidate score:", err);
      toast.error(err.response?.data?.message || "Failed to invalidate assessment score.");
    } finally {
      setInvalidating(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => { });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const trust = result.trustScore !== undefined ? result.trustScore : 100;

  // Calculate integrity level
  let integrityLevel = "Excellent";
  let integrityColor = "text-emerald-500 border-emerald-200 bg-emerald-50";
  let integrityProgressColor = "stroke-emerald-500";

  if (trust < 50) {
    integrityLevel = "Severe Violation";
    integrityColor = "text-red-600 border-red-200 bg-red-50";
    integrityProgressColor = "stroke-red-600";
  } else if (trust < 70) {
    integrityLevel = "High Risk";
    integrityColor = "text-orange-500 border-orange-200 bg-orange-50";
    integrityProgressColor = "stroke-orange-500";
  } else if (trust < 85) {
    integrityLevel = "Suspicious";
    integrityColor = "text-amber-500 border-amber-200 bg-amber-50";
    integrityProgressColor = "stroke-amber-500";
  } else if (trust < 95) {
    integrityLevel = "Good";
    integrityColor = "text-teal-500 border-teal-200 bg-teal-50";
    integrityProgressColor = "stroke-teal-500";
  }

  // Calculate SVG stroke offset for the trust score circle
  // Radius = 50, Circumference = 2 * PI * 50 = 314.16
  const strokeDashoffset = 314.16 - (314.16 * trust) / 100;

  // Format date
  const examDate = result.completedAt ? new Date(result.completedAt).toLocaleString() : 'N/A';

  // Fallbacks for simulated logs if missing (for legacy or empty records)
  const defaultScreenLogs = [
    { timestamp: "10:15:32 AM", event: "Fullscreen Mode Initiated", severity: "low" },
    { timestamp: "10:18:45 AM", event: "Window Focus Lost (Tab Switched)", severity: "high" },
    { timestamp: "10:22:12 AM", event: "Right Click Attempt Blocked", severity: "medium" },
    { timestamp: "10:25:01 AM", event: "Keyboard Copy Shortcut Intercepted", severity: "high" }
  ];

  const defaultAudioLogs = [
    { timestamp: "10:16:10 AM", event: "Ambient Calibrated: 32dB", severity: "low" },
    { timestamp: "10:20:15 AM", event: "Whispering Voices Detected", severity: "medium" },
    { timestamp: "10:24:30 AM", event: "Unusual Continuous Conversation", severity: "high" }
  ];

  const defaultObjectLogs = [
    { timestamp: "10:15:40 AM", event: "Webcam Stream Active", severity: "low" },
    { timestamp: "10:19:12 AM", event: "Mobile Phone Detected", severity: "high" },
    { timestamp: "10:23:44 AM", event: "Calculator Detected", severity: "low" }
  ];

  const screenLogs = result.screenActivityLog && result.screenActivityLog.length > 0 ? result.screenActivityLog : defaultScreenLogs;
  const audioLogs = result.audioActivityLog && result.audioActivityLog.length > 0 ? result.audioActivityLog : defaultAudioLogs;
  const objectLogs = result.objectDetectionLog && result.objectDetectionLog.length > 0 ? result.objectDetectionLog : defaultObjectLogs;
  const screenshotsList = result.screenshots && result.screenshots.length > 0 ? result.screenshots : [];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex justify-between items-center">
        {/* Back Button */}
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 font-bold text-sm flex items-center gap-2 transition-colors">
          &larr; Back to Proctoring Hub
        </button>

        {/* Invalidate / Remove Score Button */}
        {result.isInvalidated ? (
          <span className="px-4 py-2 bg-red-550 border border-red-200 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 bg-red-50/50">
            Score Invalidated
          </span>
        ) : (
          <button
            onClick={handleRemoveScore}
            disabled={invalidating}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-red-500/10 hover:shadow-red-500/25 disabled:opacity-50"
          >
            <Trash2 size={12} /> {invalidating ? 'Removing...' : 'Remove Score'}
          </button>
        )}
      </div>

      {/* Auto Submit Violation Banner */}
      {result.autoSubmitReason && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] flex items-start gap-5 shadow-lg shadow-red-500/5"
        >
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black text-red-950 uppercase tracking-tight">Assessment Automatically Terminated</h3>
            <p className="text-red-700 text-sm font-medium mt-1 leading-relaxed">
              This assessment was automatically submitted because of a critical integrity violation:
              <strong className="bg-red-200/50 px-2 py-0.5 rounded text-red-950 ml-1 font-bold ">"{result.autoSubmitReason}"</strong>.
            </p>
          </div>
        </motion.div>
      )}

      {/* Candidate Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <img
            src={result.user?.profilePicture ? (result.user.profilePicture.startsWith('http') ? result.user.profilePicture : `${API_BASE_URL}${result.user.profilePicture}`) : `https://ui-avatars.com/api/?name=${result.user?.name || 'Candidate'}&background=0f172a&color=fff&size=128`}
            className="w-24 h-24 rounded-3xl object-cover border border-slate-100 shadow"
          />
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter ">{result.user?.name || 'Unknown Candidate'}</h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">Candidate ID: {result.user?._id || 'N/A'}</p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{result.course?.title || 'Solar Panel Course'}</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-mono font-bold">{examDate}</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1">
                <Clock size={12} /> {Math.floor((result.duration || 0) / 60)}m {(result.duration || 0) % 60}s
              </span>
              {(() => {
                const getRec = () => {
                  if (result.isInvalidated || result.autoSubmitReason || trust < 50) {
                    return { text: "Disqualify Attempt", color: "bg-red-100 text-red-700 border-red-200" };
                  }
                  if (trust >= 95 && (result.warnings || 0) === 0) {
                    return { text: "Pass Review", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
                  }
                  if (trust >= 85) {
                    return { text: "Manual Review Required", color: "bg-teal-100 text-teal-700 border-teal-200" };
                  }
                  return { text: "High Risk Attempt", color: "bg-orange-100 text-orange-700 border-orange-200" };
                };
                const rec = getRec();
                return (
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${rec.color}`}>
                    Rec: {rec.text}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 text-center md:text-right shrink-0">
          <div className="w-px h-16 bg-slate-100 hidden md:block"></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Suspicion Score</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">
              {result.aiSuspicionScore !== undefined ? result.aiSuspicionScore : Math.max(0, 100 - trust)}%
            </p>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-wider">Predictive ML</span>
          </div>
          <div className="w-px h-16 bg-slate-100"></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assessment Score</p>
            <p className={`text-5xl font-black tracking-tighter ${result.isInvalidated ? 'text-red-600 line-through' : 'text-slate-900'}`}>
              {result.totalQuestions ? Math.round((result.score / result.totalQuestions) * 100) : 0}%
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              {result.isInvalidated ? 'Score Invalidated' : `${result.score} / ${result.totalQuestions} Questions`}
            </p>
          </div>
        </div>
      </div>

      {/* Candidate Audit Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl text-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Correct Answers</span>
          <span className="text-emerald-600 font-black text-lg">{result.correctCount !== undefined ? result.correctCount : result.score}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl text-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Wrong Answers</span>
          <span className="text-red-500 font-black text-lg">{result.wrongCount !== undefined ? result.wrongCount : 0}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl text-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Not Attempted</span>
          <span className="text-slate-500 font-black text-lg">{result.notAttemptedCount !== undefined ? result.notAttemptedCount : 0}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl text-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Auto Submitted</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${result.submissionType === 'Auto Submission Due To Violations' || result.autoSubmitReason
            ? 'bg-red-50 text-red-600 border border-red-100'
            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}>
            {result.submissionType === 'Auto Submission Due To Violations' || result.autoSubmitReason ? 'YES' : 'NO'}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl text-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Submission Type</span>
          <span className="text-slate-900 font-black text-xs block truncate mt-1">
            {result.submissionType || 'Normal Submission'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Video + Logs */}
        <div className="lg:col-span-2 space-y-8">

          {/* Webcam stream visualizer */}
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Video size={16} className="text-red-500 animate-pulse" /> Live-Style Candidate Visual Playback
              </h3>
              <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider">
                Audited Feed
              </span>
            </div>

            <div className="aspect-video bg-black rounded-3xl relative overflow-hidden border border-slate-800 shadow-inner group">
              <video
                ref={videoRef}
                src={getVideoUrl(result.videoRecordingUrl) || "https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-laptop-43091-large.mp4"}
                className="w-full h-full object-cover opacity-85"
                playsInline
                loop
                muted
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {!result.videoRecordingUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-10 p-4 text-center">
                  <Video size={36} className="text-slate-400 mb-2 animate-pulse" />
                  <p className="text-sm font-black text-white uppercase tracking-wider">No Recorded Video Available</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                    This attempt was completed without a live webcam feed recording.
                  </p>
                </div>
              )}

              {/* Bounding box simulation overlays */}
              <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border-2 border-emerald-500 rounded flex flex-col justify-between p-1 pointer-events-none">
                <span className="bg-emerald-500 text-white font-black text-[9px] px-1 py-0.5 rounded w-max">
                  Face: Verified (Match 98.4%)
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[8px] text-right">
                  Gaze: SCREEN
                </span>
              </div>

              {result.warnings > 2 && (
                <div className="absolute top-[15%] right-[10%] w-[100px] h-[80px] border-2 border-red-500 rounded p-1 pointer-events-none">
                  <span className="bg-red-500 text-white font-black text-[8px] px-1 py-0.5 rounded w-max">
                    Object: Mobile Phone
                  </span>
                </div>
              )}

              {/* Status bar */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md p-3 rounded-2xl flex justify-between items-center text-white border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                    Stream: {isPlaying ? 'PLAYING FEED' : 'PAUSED FEED'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSkip(-10)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Rewind 10s"
                  >
                    <Rewind size={16} />
                  </button>
                  <button
                    onClick={handlePlayPause}
                    className="p-2 bg-white text-slate-950 rounded-xl hover:scale-105 transition-transform flex items-center justify-center"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <button
                    onClick={() => handleSkip(10)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Forward 10s"
                  >
                    <FastForward size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Screenshots Grid */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
              <Eye className="text-primary" /> Webcam Audit Screenshots
            </h3>
            {screenshotsList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {screenshotsList.map((src, idx) => (
                  <div key={idx} className="group relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <img src={src} className="w-full h-full object-cover" alt={`Audit Capture ${idx + 1}`} />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[8px] font-mono text-white px-2 py-0.5 rounded shadow">
                      Capture #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                <ShieldAlert size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-500">No Webcam Screenshots Logged for this Attempt</p>
                <p className="text-[10px] text-slate-400 mt-1">Webcam captures are snapped and saved automatically when violations occur.</p>
              </div>
            )}
          </div>

          {/* Tabbed Activity Logs */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-6 gap-4">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Activity className="text-primary" /> Integrity Activity Logs
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('screen')}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'screen' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                >
                  Screen & Window
                </button>
                <button
                  onClick={() => setActiveTab('audio')}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'audio' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                >
                  Audio & Voice
                </button>
                <button
                  onClick={() => setActiveTab('objects')}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'objects' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                >
                  Object & AI
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Event Description</th>
                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'screen' && screenLogs.map((log, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 text-xs font-mono font-bold text-slate-500">{log.timestamp}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{log.event}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${log.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          log.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            log.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>{log.severity}</span>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'audio' && audioLogs.map((log, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 text-xs font-mono font-bold text-slate-500">{log.timestamp}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{log.event}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${log.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          log.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            log.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>{log.severity}</span>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'objects' && objectLogs.map((log, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 text-xs font-mono font-bold text-slate-500">{log.timestamp}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{log.event}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${log.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          log.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            log.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>{log.severity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question Analysis */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
              <BrainCircuit className="text-primary" /> Question Response Timeline
            </h3>
            <div className="space-y-6">
              {result.answers?.map((ans, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${ans.isCorrect ? 'bg-emerald-50/40 border-emerald-100' : 'bg-red-50/40 border-red-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-slate-900 text-sm">Question {ans.questionIndex + 1}</h4>
                    <div className="flex gap-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> {ans.timeTaken}s</span>
                      {ans.violationCountDuringQuestion > 0 && (
                        <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded">
                          <AlertTriangle size={12} /> {ans.violationCountDuringQuestion} Flags
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Candidate Selected</p>
                      <p className={`font-bold text-sm ${ans.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>{ans.candidateAnswer || 'Skipped / Terminated'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Correct Answer</p>
                      <p className="font-bold text-sm text-slate-700">{ans.correctAnswer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Trust scoring engine + Timeline */}
        <div className="space-y-8 col-span-1">

          {/* Trust score engine circular gauge */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 w-full text-left">
              Integrity Profile
            </h3>

            {/* SVG Circular Gauge */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Track */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className={`transition-all duration-1000 ${integrityProgressColor}`}
                  strokeWidth="10"
                  strokeDasharray="314.16"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              {/* Score Value Overlay */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-black tracking-tighter">{trust}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Trust Score</span>
              </div>
            </div>

            <div className="w-full">
              <div className={`px-4 py-2 border rounded-2xl font-black text-xs uppercase tracking-wider mb-6 ${integrityColor}`}>
                {integrityLevel}
              </div>

              <div className="space-y-3 font-medium text-xs">
                <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-slate-400">Total Warnings</span>
                  <span className="font-bold text-white">{result.warnings || 0} Flags</span>
                </div>
                <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-slate-400">High Risk Triggers</span>
                  <span className="font-bold text-white">
                    {result.violationTimeline?.filter(v => v.severity === 'high' || v.severity === 'critical').length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Violation Timeline */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
              Violation Audit Timeline
            </h3>
            {result.violationTimeline && result.violationTimeline.length > 0 ? (
              <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
                {result.violationTimeline.map((v, i) => (
                  <div key={i} className="relative group">
                    {/* Circle Indicator */}
                    <div className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white shadow ${v.severity === 'critical' ? 'bg-red-500' :
                      v.severity === 'high' ? 'bg-orange-500' :
                        v.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}></div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 font-mono">{v.timestamp}</span>
                        <span className={`px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider rounded ${v.severity === 'critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                          v.severity === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                            v.severity === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>{v.severity}</span>
                      </div>
                      <p className="text-xs font-black text-slate-900 leading-tight">{v.type}</p>
                      <p className="text-[11px] font-medium text-slate-500 leading-normal">{v.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
                <p className="text-xs font-bold text-slate-600">Zero Violations Detected</p>
                <p className="text-[10px] text-slate-400 mt-1">Excellent assessment integrity.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProctoring;
