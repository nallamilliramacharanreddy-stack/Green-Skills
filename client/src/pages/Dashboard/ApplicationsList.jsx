import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, XCircle, 
  ExternalLink, User, Briefcase,
  Clock, Filter, Search, Award, Calendar,
  Video, MailCheck, RefreshCw, ChevronRight, MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const StatusBadge = ({ status }) => {
  const cfg = {
    hired:       { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',    label: 'Hired' },
    shortlisted: { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',       label: 'Shortlisted' },
    pending:     { cls: 'bg-amber-50 text-amber-700 border-amber-200',          label: 'Pending Review' },
    reviewed:    { cls: 'bg-blue-50 text-blue-700 border-blue-200',             label: 'Reviewed' },
    rejected:    { cls: 'bg-slate-50 text-slate-500 border-slate-200',          label: 'Rejected' },
  };
  const { cls, label } = cfg[status] || cfg.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cls}`}>
      {label}
    </span>
  );
};

const ApplicationsList = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${API_URL}/applications/employer/${user._id}`);
      setApplications(res.data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchApplications();
  }, [user]);

  // Opens interview scheduling modal — works for both first-time shortlisting AND rescheduling
  const handleScheduleInterviewClick = (app) => {
    setSelectedApp(app);

    // Pre-fill with existing values if already scheduled
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
    setShowShortlistModal(true);
  };

  // For first-time shortlisting (non-shortlisted candidates)
  const handleShortlistClick = (app) => {
    handleScheduleInterviewClick(app);
  };

  const handleHireClick = (app) => {
    setSelectedApp(app);
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    setJoiningDate(twoWeeks.toISOString().split('T')[0]);
    setShowHireModal(true);
  };

  const handleShortlistSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsSubmitting(true);
    const wasAlreadyShortlisted = selectedApp.status === 'shortlisted';
    try {
      await axios.patch(`${API_URL}/applications/${selectedApp._id}/status`, { 
        status: 'shortlisted', 
        interviewDate,
        interviewLink,
        scheduleInterviewOnly: wasAlreadyShortlisted
      });
      toast.success(
        wasAlreadyShortlisted
          ? '📅 Interview rescheduled — invitation email sent to candidate!'
          : '🎉 Candidate shortlisted and interview invitation sent!'
      );
      setShowShortlistModal(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsSubmitting(true);
    try {
      await axios.patch(`${API_URL}/applications/${selectedApp._id}/status`, { 
        status: 'hired', 
        joiningDate 
      });
      toast.success('✅ Candidate hired — confirmation email sent!');
      setShowHireModal(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to hire candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = async (appId) => {
    if (!window.confirm('Are you sure you want to reject this candidate?')) return;
    try {
      await axios.patch(`${API_URL}/applications/${appId}/status`, { status: 'rejected' });
      toast.success('Application rejected.');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredApps = filterStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === filterStatus);

  const shortlistedCount = applications.filter(a => a.status === 'shortlisted').length;
  const examClearedCount = applications.filter(a => a.examResult && typeof a.examResult.score === 'number').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter ">Applications Hub</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Review talent applications and manage your hiring pipeline.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick stats */}
          {shortlistedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <Award size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">{shortlistedCount} Shortlisted</span>
            </div>
          )}
          {examClearedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{examClearedCount} Exam Cleared</span>
            </div>
          )}
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest text-slate-600"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Application Cards */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          filteredApps.map((app) => {
            const hasInterview = !!app.interviewDate;
            const isShortlisted = app.status === 'shortlisted';
            const isHired = app.status === 'hired';
            const examPercent = app.examResult && typeof app.examResult.score === 'number'
              ? Math.round((app.examResult.score / app.examResult.totalQuestions) * 100)
              : null;

            return (
              <motion.div 
                key={app._id}
                layout
                className="bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
              >
                {/* Top ribbon for shortlisted + interview scheduled */}
                {isShortlisted && hasInterview && (
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3 flex items-center gap-3">
                    <Calendar size={14} className="text-white/80" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      Interview: {new Date(app.interviewDate).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {app.interviewLink && (
                      <a 
                        href={app.interviewLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/30 transition-colors"
                      >
                        <Video size={10} /> Join Link
                      </a>
                    )}
                  </div>
                )}

                <div className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Candidate info */}
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
                        <User size={28} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{app.studentId?.name}</h3>
                          <StatusBadge status={app.status} />
                          {examPercent !== null && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle size={10} /> Exam Cleared ({examPercent}%)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase size={12} className="text-primary" />
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest ">
                            Applied for: {app.jobId?.title || app.geoVacancyId?.jobTitle || 'Unknown Position'}
                          </p>
                          {app.geoVacancyId && (
                            <span className="ml-2 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                              <MapPin size={8} /> Geo Vacancy
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><Award size={14} className="text-primary" /> {app.studentId?.education || 'N/A'}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /> {new Date(app.appliedAt).toLocaleDateString()}</span>
                          {app.studentId?.email && (
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <MailCheck size={14} className="text-primary" /> {app.studentId.email}
                            </span>
                          )}
                        </div>

                        {/* Interview details block (compact) */}
                        {isShortlisted && !hasInterview && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl w-fit">
                            <Calendar size={12} className="text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">Interview not yet scheduled — click to schedule</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {!isHired && (
                        <>
                          {/* Schedule / Reschedule Interview — shown for shortlisted candidates */}
                          {isShortlisted && (
                            <button 
                              onClick={() => handleScheduleInterviewClick(app)}
                              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                                hasInterview
                                  ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-100'
                                  : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100 animate-pulse'
                              }`}
                            >
                              {hasInterview ? <><RefreshCw size={14} /> Reschedule</> : <><Calendar size={14} /> Schedule Interview</>}
                            </button>
                          )}

                          {/* Shortlist button — shown for non-shortlisted candidates */}
                          {!isShortlisted && (
                            <button 
                              onClick={() => handleShortlistClick(app)}
                              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all"
                            >
                              <Award size={16} /> Shortlist &amp; Schedule
                            </button>
                          )}

                          {/* Hire button */}
                          <button 
                            onClick={() => handleHireClick(app)}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                          >
                            <CheckCircle size={16} /> Hire
                          </button>
                        </>
                      )}

                      {isHired && (
                        <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-200">
                          <CheckCircle size={16} /> Employment Confirmed
                          {app.joiningDate && (
                            <span className="text-[9px] text-emerald-500 ml-1">· {new Date(app.joiningDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}

                      {app.status !== 'rejected' && !isHired && (
                        <button 
                          onClick={() => handleRejectClick(app._id)}
                          className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                          title="Reject candidate"
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {!loading && filteredApps.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <FileText className="mx-auto w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Applications Received</h3>
            <p className="text-slate-400 text-sm mt-2">Active recruitment drives will populate this nexus with talent applications.</p>
          </div>
        )}
      </div>

      {/* ── Schedule / Shortlist + Interview Modal ── */}
      <AnimatePresence>
        {showShortlistModal && (
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
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter ">
                  {selectedApp?.status === 'shortlisted' ? 'Schedule Interview' : 'Shortlist & Schedule'}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {selectedApp?.status === 'shortlisted' ? 'Rescheduling for' : 'Shortlisting'} {selectedApp?.studentId?.name}
                </p>
                {selectedApp?.examResult && typeof selectedApp.examResult.score === 'number' && (
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full mx-auto w-fit mt-2">
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                      Exam Cleared · {Math.round((selectedApp.examResult.score / selectedApp.examResult.totalQuestions) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleShortlistSubmit} className="space-y-4">
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
                  <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                    An email invitation with the interview date, time, and meeting link will be automatically sent to <strong>{selectedApp?.studentId?.email}</strong>.
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowShortlistModal(false); setSelectedApp(null); }}
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
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <><MailCheck size={14} /> Send Invitation</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Hire Modal ── */}
      <AnimatePresence>
        {showHireModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl max-w-md w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <CheckCircle className="mx-auto text-emerald-500 w-12 h-12" />
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter ">Confirm Hiring</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hiring {selectedApp?.studentId?.name}</p>
              </div>

              <form onSubmit={handleHireSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Joining Date *</label>
                  <input 
                    type="date" 
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold text-xs uppercase"
                  />
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                  <MailCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-emerald-700 leading-relaxed">
                    An official offer confirmation email will be sent to <strong>{selectedApp?.studentId?.email}</strong>.
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowHireModal(false); setSelectedApp(null); }}
                    className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <><CheckCircle size={14} /> Confirm Offer</>
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

export default ApplicationsList;
