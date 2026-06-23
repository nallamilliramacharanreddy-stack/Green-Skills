import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, XCircle, 
  ExternalLink, User, Briefcase,
  Clock, Filter, Search, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const ApplicationsList = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals state
  const [selectedApp, setSelectedApp] = useState(null);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  
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

  const handleShortlistClick = (app) => {
    setSelectedApp(app);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const offset = tomorrow.getTimezoneOffset();
    const localTomorrow = new Date(tomorrow.getTime() - offset * 60 * 1000);
    setInterviewDate(localTomorrow.toISOString().slice(0, 16));
    setInterviewLink('https://meet.google.com/');
    setShowShortlistModal(true);
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
    try {
      await axios.patch(`${API_URL}/applications/${selectedApp._id}/status`, { 
        status: 'shortlisted', 
        interviewDate,
        interviewLink
      });
      toast.success('Candidate shortlisted and virtual interview invitation sent.');
      setShowShortlistModal(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to shortlist candidate');
    }
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await axios.patch(`${API_URL}/applications/${selectedApp._id}/status`, { 
        status: 'hired', 
        joiningDate 
      });
      toast.success('Candidate hired successfully and confirmation email sent.');
      setShowHireModal(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to hire candidate');
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Applications Hub</h2>
          <p className="text-slate-500 text-sm font-medium">Review talent applications and manage your hiring pipeline.</p>
        </div>
        <div className="flex items-center gap-4">
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

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          filteredApps.map((app) => (
            <motion.div 
              key={app._id}
              layout
              className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <User size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{app.studentId?.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        app.status === 'hired' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        app.status === 'shortlisted' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        app.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        {app.status}
                      </span>
                      {app.examResult && typeof app.examResult.score === 'number' && (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Cleared Exam ({Math.round((app.examResult.score / app.examResult.totalQuestions) * 100)}%)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase size={12} className="text-primary" />
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Applied for: {app.jobId?.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><Award size={14} className="text-primary" /> {app.studentId?.education || 'N/A'}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /> {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {app.status !== 'hired' && (
                    <>
                      <button 
                        onClick={() => handleHireClick(app)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                      >
                        <CheckCircle size={16} /> Hire Candidate
                      </button>
                      {app.status !== 'shortlisted' && (
                        <button 
                          onClick={() => handleShortlistClick(app)}
                          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all"
                        >
                          <Award size={16} /> Shortlist
                        </button>
                      )}
                    </>
                  )}
                  {app.status === 'hired' && (
                    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-200">
                      <CheckCircle size={16} /> Employment Confirmed
                    </div>
                  )}
                  {app.status !== 'rejected' && app.status !== 'hired' && (
                    <button 
                      onClick={() => handleRejectClick(app._id)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
        {!loading && filteredApps.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <FileText className="mx-auto w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Applications Received</h3>
            <p className="text-slate-400 text-sm mt-2">Active recruitment drives will populate this nexus with talent applications.</p>
          </div>
        )}
      </div>

      {/* Shortlist / Interview Scheduling Modal */}
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
                <Award className="mx-auto text-primary w-12 h-12" />
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Schedule Interview</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Shortlisting {selectedApp?.studentId?.name}</p>
              </div>

              <form onSubmit={handleShortlistSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-550 uppercase tracking-widest ml-1">Interview Date & Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold text-xs uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-555 uppercase tracking-widest ml-1">Virtual Meeting Link</label>
                  <input 
                    type="url" 
                    required
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold text-xs"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShortlistModal(false);
                      setSelectedApp(null);
                    }}
                    className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-slate-900 text-white hover:bg-primary rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hiring Modal (Joining Date Picker) */}
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
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Confirm Hiring</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hiring {selectedApp?.studentId?.name}</p>
              </div>

              <form onSubmit={handleHireSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Joining Date</label>
                  <input 
                    type="date" 
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold text-xs uppercase"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHireModal(false);
                      setSelectedApp(null);
                    }}
                    className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20"
                  >
                    Confirm Offer
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
