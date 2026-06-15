import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, MessageCircle, Star, 
  ArrowRight, Shield, Zap, Target, Activity, CheckCircle, Clock, Plus, X, Video
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const GuideDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Schedule form state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [topic, setTopic] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingSession, setSubmittingSession] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const guideId = user?._id || user?.id;
      if (!guideId) return;

      try {
        const [studentsRes, sessionsRes] = await Promise.all([
          axios.get(`${API_URL}/auth/users`),
          axios.get(`${API_URL}/mentor-sessions/guide/${guideId}`)
        ]);
        setStudents(studentsRes.data || []);
        setSessions(sessionsRes.data?.sessions || sessionsRes.data || []);
      } catch (err) {
        console.error("Error loading guide dashboard data:", err);
        toast.error("Failed to load mentor topology");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    const guideId = user?._id || user?.id;
    if (!guideId || !selectedStudent || !topic || !scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmittingSession(true);
    try {
      const res = await axios.post(`${API_URL}/mentor-sessions`, {
        mentor: guideId,
        student: selectedStudent,
        scheduledAt,
        topic,
        notes
      });
      const newSession = res.data.session || res.data;
      setSessions(prev => [newSession, ...prev]);
      toast.success("Mentorship session scheduled successfully!");
      setShowScheduleModal(false);
      
      // Reset form
      setSelectedStudent('');
      setTopic('');
      setScheduledAt('');
      setNotes('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule session");
    } finally {
      setSubmittingSession(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId, status) => {
    try {
      const res = await axios.patch(`${API_URL}/mentor-sessions/${sessionId}/status`, { status });
      const updatedSession = res.data.session || res.data;
      setSessions(prev => prev.map(s => s._id === sessionId ? updatedSession : s));
      toast.success(`Session status updated to ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update session status");
    }
  };

  return (
    <DashboardLayout role="guide">
      <div className="max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
              Mentor<br/><span className="text-primary">Nexus.</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Guide & Mentorship Topology</p>
          </div>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="group px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-primary transition-colors shadow-2xl hover:shadow-primary/30"
          >
            Schedule Session <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">Calibrating Nexus Matrix...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Main Student Roster */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="xl:col-span-2 relative bg-white rounded-[3rem] p-8 md:p-10 overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-[1rem] flex items-center justify-center text-primary shadow-sm">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Assigned Cadets</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Mentorship Roster</p>
                  </div>
                </div>
                <div className="px-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                  {students.length} Registered Student Nodes
                </div>
              </div>

              <div className="space-y-4">
                {students.length > 0 ? (
                  students.map((student, i) => {
                    const totalCourses = (student.progress?.completedCourses?.length || 0) + (student.progress?.currentCourses?.length || 0);
                    const progressPercent = totalCourses > 0 
                      ? Math.round(((student.progress?.completedCourses?.length || 0) / totalCourses) * 100)
                      : 0;

                    let status = "On Track";
                    let risk = "low";
                    if (totalCourses > 0 && progressPercent < 30) {
                      status = "Needs Intervention";
                      risk = "high";
                    } else if (progressPercent >= 80) {
                      status = "Accelerated";
                      risk = "low";
                    } else if (totalCourses > 0 && progressPercent < 60) {
                      status = "Slow Progress";
                      risk = "medium";
                    }

                    return (
                      <div key={student._id || i} className="group p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 hover:shadow-md transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center font-black text-xl italic shadow-inner">
                            {student.name?.[0] || '?'}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{student.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span>{student.email}</span>
                              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                              <span>Lang: {student.preferredLanguage || 'English'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className="text-right hidden sm:block">
                            <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{progressPercent}%</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Sync Rate</p>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            risk === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            risk === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {status}
                          </span>
                          <button 
                            onClick={() => {
                              setSelectedStudent(student._id);
                              setShowScheduleModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                          >
                            Schedule Session
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 italic">No registered student nodes found.</div>
                )}
              </div>
            </motion.div>

            {/* Sidebar Modules */}
            <div className="space-y-6">
              
              {/* Guide Performance Node */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-[conic-gradient(from_180deg,transparent_0_340deg,rgba(16,185,129,0.3)_360deg)] animate-[spin_4s_linear_infinite] origin-bottom-left opacity-30"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-[1rem] flex items-center justify-center text-amber-400 mb-6 border border-white/5">
                    <Star size={20} fill="currentColor" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Mentor Rating</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                    Your guidance protocols have increased student retention by 12% this cycle.
                  </p>
                  
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-6xl font-black tracking-tighter">4.9</span>
                    <span className="text-xl font-black text-slate-500 tracking-tighter mb-1">/ 5.0</span>
                  </div>

                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[98%] shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
                  </div>
                </div>
              </motion.div>

              {/* Schedule Module */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Event Queue</h3>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {sessions.length > 0 ? (
                    sessions.map((session, i) => {
                      const isPending = session.status === 'pending';
                      const isConfirmed = session.status === 'confirmed';
                      const isCancelled = session.status === 'cancelled';
                      
                      return (
                        <div key={session._id || i} className={`p-4 rounded-2xl border bg-white border-slate-100 hover:shadow-sm transition-all space-y-2`}>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {new Date(session.scheduledAt).toLocaleDateString()} @ {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              isCancelled ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              isConfirmed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">{session.topic}</h4>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cadet: {session.student?.name || 'Unknown student'}</p>
                          </div>

                          {session.meetingLink && !isCancelled && (
                            <a 
                              href={session.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              <Video size={10} /> Join Meeting Room
                            </a>
                          )}

                          {isPending && (
                            <div className="flex gap-2 pt-2 border-t border-slate-50">
                              <button 
                                onClick={() => handleUpdateSessionStatus(session._id, 'cancelled')}
                                className="flex-1 py-1 rounded bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-wider"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleUpdateSessionStatus(session._id, 'confirmed')}
                                className="flex-1 py-1 rounded bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider"
                              >
                                Confirm
                              </button>
                            </div>
                          )}

                          {isConfirmed && (
                            <button 
                              onClick={() => handleUpdateSessionStatus(session._id, 'completed')}
                              className="w-full py-1 rounded bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider mt-2"
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400 italic text-xs">No upcoming events scheduled.</div>
                  )}
                </div>

                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full mt-6 py-4 border-2 border-slate-200 border-dashed text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
                >
                  Schedule New Session
                </button>
              </motion.div>

            </div>
          </div>
        )}
      </div>

      {/* Schedule Session Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="text-primary" size={24} />
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Schedule Mentorship</h3>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleScheduleSession} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Student Cadet *</label>
                  <select 
                    required
                    value={selectedStudent} 
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 bg-white outline-none font-bold text-sm text-slate-900"
                  >
                    <option value="">-- Choose student --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Topic *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Solar panel installation doubts"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 outline-none font-bold text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scheduled At (Date & Time) *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 outline-none font-bold text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Topic notes / Meeting Details (Optional)</label>
                  <textarea 
                    placeholder="Provide meeting link or pre-reading details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 outline-none resize-none h-24 text-sm text-slate-600 placeholder:text-slate-400"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingSession}
                    className="flex-1 py-4 bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-50"
                  >
                    {submittingSession ? 'Scheduling...' : 'Confirm Session'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
};

export default GuideDashboard;
