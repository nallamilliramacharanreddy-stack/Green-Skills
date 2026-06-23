import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle, Mail,
  Briefcase, Calendar, Video, 
  MailCheck, RefreshCw, XCircle, 
  Award, Clock, ExternalLink 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const ShortlistedUsers = () => {
  const { user } = useAuth();
  const [shortlisted, setShortlisted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLink, setInterviewLink] = useState('');

  const fetchShortlisted = async () => {
    try {
      const res = await axios.get(`${API_URL}/applications/employer/${user._id}`);
      // Filter only shortlisted ones
      setShortlisted(res.data.filter(app => app.status === 'shortlisted'));
    } catch (error) {
      toast.error('Failed to load shortlisted candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchShortlisted();
  }, [user]);

  const handleScheduleClick = (app) => {
    setSelectedApp(app);
    if (app.interviewDate) {
      const d = new Date(app.interviewDate);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      setInterviewDate(local.toISOString().slice(0, 16));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const offset = tomorrow.getTimezoneOffset();
      const local = new Date(tomorrow.getTime() - offset * 60 * 1000);
      setInterviewDate(local.toISOString().slice(0, 16));
    }
    setInterviewLink(app.interviewLink || 'https://meet.google.com/');
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsSubmitting(true);
    try {
      await axios.patch(`${API_URL}/applications/${selectedApp._id}/status`, { 
        status: 'shortlisted', 
        interviewDate,
        interviewLink,
        scheduleInterviewOnly: true
      });
      toast.success('🎉 Interview schedule saved and invitation email sent!');
      setShowScheduleModal(false);
      setSelectedApp(null);
      fetchShortlisted();
    } catch (error) {
      toast.error('Failed to save interview details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Shortlisted Candidates</h2>
            <p className="text-slate-400 text-sm font-medium mt-2">Manage scheduled interviews and communications for shortlisted talent.</p>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-[32px]">
            <Award className="text-indigo-400" size={32} />
            <div>
              <p className="text-white text-2xl font-black">{shortlisted.length}</p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Shortlisted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Shortlisted Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          shortlisted.map((app, i) => {
            const hasInterview = !!app.interviewDate;
            const examPercent = app.examResult && typeof app.examResult.score === 'number'
              ? Math.round((app.examResult.score / app.examResult.totalQuestions) * 100)
              : null;

            return (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[380px]"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <Users size={28} className="text-indigo-500 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{app.studentId?.name}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{app.studentId?.education || 'Graduate'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                      Shortlisted
                    </span>
                    {examPercent !== null && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                        <CheckCircle size={10} /> Passed Quiz ({examPercent}%)
                      </span>
                    )}
                  </div>

                  <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 mb-6 space-y-3 font-medium text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Briefcase size={14} className="text-primary" />
                      <span>Role: <strong>{app.jobId?.title}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail size={14} className="text-primary" />
                      <span className="truncate">{app.studentId?.email}</span>
                    </div>
                  </div>

                  {/* Scheduled interview info box */}
                  {hasInterview ? (
                    <div className="p-5 bg-indigo-50/50 border border-indigo-100/50 rounded-[24px] mb-6 space-y-3 text-xs">
                      <div className="flex items-center gap-2.5 text-indigo-700 font-bold">
                        <Calendar size={14} />
                        <span>
                          {new Date(app.interviewDate).toLocaleString('en-IN', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {app.interviewLink && (
                        <a 
                          href={app.interviewLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2 text-indigo-500 font-semibold hover:underline"
                        >
                          <Video size={14} /> Join Meeting <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 bg-amber-50/60 border border-amber-100/60 rounded-[24px] mb-6 flex items-center gap-2.5 text-xs text-amber-700 font-bold">
                      <Clock size={14} className="animate-pulse" />
                      <span>Interview date not set</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto w-full">
                  <button 
                    onClick={() => handleScheduleClick(app)}
                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                      hasInterview
                        ? 'bg-slate-900 text-white hover:bg-primary shadow-slate-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 animate-pulse'
                    }`}
                  >
                    {hasInterview ? (
                      <><RefreshCw size={12} /> Reschedule Invite</>
                    ) : (
                      <><Calendar size={12} /> Set Interview Time</>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
        {!loading && shortlisted.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <Users className="mx-auto w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Shortlisted Candidates</h3>
            <p className="text-slate-400 text-sm mt-2">When candidates clear screening exams or are manually shortlisted, they will appear here.</p>
          </div>
        )}
      </div>

      {/* ── Schedule Modal ── */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl max-w-md w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
                  <Calendar className="text-indigo-500 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                  {selectedApp?.interviewDate ? 'Reschedule Interview' : 'Set Interview Details'}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Sending secure invite to {selectedApp?.studentId?.name}
                </p>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Interview Date &amp; Time *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold text-xs uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Virtual Meeting Link *</label>
                  <input 
                    type="url" 
                    required
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold text-xs"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                  <MailCheck size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-indigo-700 leading-relaxed font-mono">
                    System will automatically dispatch an official email invitation containing meeting links and details to <strong>{selectedApp?.studentId?.email}</strong>.
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowScheduleModal(false); setSelectedApp(null); }}
                    className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Dispatching...</>
                    ) : (
                      <><MailCheck size={14} /> Send Invite</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShortlistedUsers;
