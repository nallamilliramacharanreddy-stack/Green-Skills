import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FileText, Clock, HelpCircle, Building2, 
  Award, Shield, Search, Play, CheckCircle, AlertTriangle,
  ShieldAlert, X, TrendingUp, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const HiringExams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const fetchData = async () => {
    try {
      const savedUserStr = sessionStorage.getItem('user');
      let savedUser = null;
      try {
        savedUser = savedUserStr && savedUserStr !== 'undefined' ? JSON.parse(savedUserStr) : null;
      } catch (e) {
        console.error("Failed to parse user session:", e);
      }
      const currentUserId = user?.id || user?._id || savedUser?.id || savedUser?._id;

      // 1. Fetch all quizzes
      const quizzesRes = await axios.get(`${API_URL}/quizzes`);
      // Filter for standalone, published hiring exams (no courseId attached)
      // And verify target candidate matching
      const hiringExams = quizzesRes.data.filter(q => {
        if (q.courseId || !q.isPublished) return false;
        if (q.assignedUser) {
          const assignedId = q.assignedUser._id || q.assignedUser;
          return currentUserId && assignedId.toString() === currentUserId.toString();
        }
        return true;
      });
      setExams(hiringExams);

      // 2. Fetch student's attempt results
      if (currentUserId) {
        const resultsRes = await axios.get(`${API_URL}/quizzes/results`, {
          params: { userId: currentUserId }
        });
        setAttempts(resultsRes.data);
      }
    } catch (error) {
      toast.error('Failed to sync hiring assessments.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Find if student has completed this exam
  const getExamStatus = (examId) => {
    // Check results where quiz matches examId
    const examAttempt = attempts.find(att => (att.quiz?._id || att.quiz)?.toString() === examId.toString());
    if (!examAttempt) return { status: 'Not Attempted', score: 0 };
    
    const percentage = Math.round((examAttempt.score / examAttempt.totalQuestions) * 100);
    return {
      status: examAttempt.status === 'Pass' ? 'Passed' : 'Failed',
      score: percentage,
      rawScore: examAttempt.score,
      totalQs: examAttempt.totalQuestions
    };
  };

  const categories = ['All', ...new Set(exams.map(e => e.category || 'General'))];

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (exam.createdBy?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exam.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartExamClick = (exam) => {
    navigate('/dashboard/quiz', { state: { activeQuiz: exam } });
  };

  const handleConfirmStart = () => {
    setShowConsentModal(false);
    if (selectedExam) {
      navigate('/dashboard/quiz', { state: { activeQuiz: selectedExam } });
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-8 space-y-10">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
              Hiring<br/><span className="text-primary">Exams.</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Fast-Track Recruitment Assessments</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search exams or companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider placeholder:text-slate-400" 
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 text-slate-700 font-bold text-xs px-4 py-4 rounded-full border border-slate-200 focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none hover:bg-white transition-all shadow-sm uppercase tracking-wider"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-[#00E5FF]/10 text-[#00E5FF] rounded-2xl flex items-center justify-center">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Assessments</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{exams.length}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-[#10B981]/10 text-[#10B981] rounded-2xl flex items-center justify-center">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passed Blueprints</p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {exams.filter(e => getExamStatus(e._id).status === 'Passed').length}
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-[#7C3AED]/10 text-[#7C3AED] rounded-2xl flex items-center justify-center">
              <Award size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Score</p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {(() => {
                  const passedExams = exams.map(e => getExamStatus(e._id)).filter(s => s.status !== 'Not Attempted');
                  if (passedExams.length === 0) return '0%';
                  const avg = Math.round(passedExams.reduce((acc, curr) => acc + curr.score, 0) / passedExams.length);
                  return `${avg}%`;
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Recruiters Blueprints</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredExams.map((exam, i) => {
              const { status, score, rawScore, totalQs } = getExamStatus(exam._id);

              return (
                <motion.div 
                  key={exam._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-white rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-primary/10 transition-all border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-slate-100">
                        <Building2 className="text-slate-400 group-hover:text-primary transition-colors" size={20} />
                      </div>
                      
                      {status === 'Passed' && (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Passed ({score}%)
                        </span>
                      )}
                      {status === 'Failed' && (
                        <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Failed ({score}%)
                        </span>
                      )}
                      {status === 'Not Attempted' && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                          New Assessment
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-2 group-hover:text-primary transition-colors">
                      {exam.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      By {exam.createdBy?.companyName || 'Verified Partner'}
                    </p>

                    <p className="text-slate-500 font-medium text-xs leading-relaxed line-clamp-3 mb-6">
                      {exam.description || 'Take this recruiter-provided technical exam to prove your mastery of key concepts and move directly into active application reviews.'}
                    </p>
                  </div>

                  <div>
                    {/* Meta Fields */}
                    <div className="grid grid-cols-2 gap-3 mb-6 border-t border-slate-100 pt-6">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{exam.duration} Minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <HelpCircle size={14} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{exam.questions?.length || 0} MCQ Questions</span>
                      </div>
                    </div>

                    {/* Action button */}
                    {status === 'Passed' ? (
                      <button
                        disabled
                        className="w-full py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        Assessment Completed ({rawScore}/{totalQs} Correct)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExamClick(exam)}
                        className="w-full py-4 bg-slate-900 text-white hover:bg-primary rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                      >
                        <Play size={12} fill="currentColor" /> {status === 'Failed' ? 'Retake Assessment' : 'Start Assessment'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filteredExams.length === 0 && (
              <div className="col-span-full">
                <div className="bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center mb-6 text-slate-300">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Hiring Exams Found</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-xs">There are no standalone recruiter exams registered under this search criteria.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attempt History & Reports Section */}
        {(() => {
          // Filter only hiring-exam attempts (quiz-based, no course)
          const hiringAttempts = attempts.filter(att => !att.course && att.quiz);
          if (hiringAttempts.length === 0) return null;
          return (
            <div className="mt-10 space-y-6">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Attempt History &amp; Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {hiringAttempts.map((attempt) => {
                  const attemptTrust = attempt.trustScore !== undefined ? attempt.trustScore : 100;
                  const scorePercent = attempt.totalQuestions
                    ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                    : 0;
                  return (
                    <motion.div
                      key={attempt._id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-3">
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

                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                          {attempt.quiz?.title || 'Hiring Assessment'}
                        </h4>

                        <div className="grid grid-cols-2 gap-2 py-2 border-t border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                          <div>
                            <span className="block text-slate-400 text-[8px] font-black">Score</span>
                            <span className={`font-black text-sm ${
                              attempt.isInvalidated ? 'text-red-600 line-through' : 'text-slate-800'
                            }`}>
                              {attempt.isInvalidated ? '0%' : `${scorePercent}%`}
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
                        className="mt-4 w-full py-2.5 bg-slate-900 hover:bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={12} /> View Integrity Report
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>

      {/* AI Face Recognition and Consent Alert Modal */}
      <AnimatePresence>
        {showConsentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl max-w-md w-full space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center border border-amber-100 shadow-sm animate-pulse">
                  <Shield size={36} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                  AI Proctoring Enabled
                </h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  This hiring exam is actively monitored using advanced **AI Face Recognition**. You will be verified against your registration-time facial descriptor to validate your identity.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  <AlertTriangle size={12} className="text-amber-500" /> Rules & Conduct
                </h4>
                <ul className="text-[10.5px] font-bold text-slate-600 space-y-2 list-disc list-inside">
                  <li>Ensure your webcam is active and properly illuminated.</li>
                  <li>Remain centered in the camera frame at all times.</li>
                  <li>Do not shift your gaze away or open other tabs/apps.</li>
                  <li>Presence of multiple faces will trigger validation alerts.</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStart}
                  className="flex-1 py-4 bg-primary text-white hover:bg-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
                >
                  Start Proctored Exam
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attempt Detail / Integrity Report Modal */}
      <AnimatePresence>
        {selectedAttempt && (
          <div className="fixed inset-0 z-[200] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-50 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-white p-6 px-8 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Assessment Audit Report</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {selectedAttempt.quiz?.title || 'Hiring Assessment'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">

                {/* Auto-submit warning */}
                {selectedAttempt.autoSubmitReason && (
                  <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-3">
                    <ShieldAlert className="text-red-500 shrink-0" size={20} />
                    <p className="text-xs text-red-900 font-medium leading-relaxed">
                      <strong>Auto-Submitted:</strong> {selectedAttempt.autoSubmitReason}
                    </p>
                  </div>
                )}

                {/* Invalidated warning */}
                {selectedAttempt.isInvalidated && (
                  <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-black text-red-900 uppercase">Attempt Invalidated</p>
                      <p className="text-[10px] text-red-700 mt-1">{selectedAttempt.invalidationReason || 'This attempt was flagged and invalidated by the AI proctoring system.'}</p>
                    </div>
                  </div>
                )}

                {/* Score Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                    <p className={`text-3xl font-black ${
                      selectedAttempt.isInvalidated ? 'text-red-500 line-through' : 'text-slate-900'
                    }`}>
                      {selectedAttempt.isInvalidated ? '0%' : `${selectedAttempt.totalQuestions ? Math.round((selectedAttempt.score / selectedAttempt.totalQuestions) * 100) : 0}%`}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1">{selectedAttempt.score} / {selectedAttempt.totalQuestions} correct</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Trust Score</p>
                    <p className={`text-3xl font-black ${
                      (selectedAttempt.trustScore ?? 100) > 75 ? 'text-emerald-500' :
                      (selectedAttempt.trustScore ?? 100) > 40 ? 'text-amber-500' : 'text-red-500'
                    }`}>{selectedAttempt.trustScore ?? 100}%</p>
                    <p className="text-[9px] text-slate-400 mt-1">AI integrity index</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Verdict</p>
                    <p className={`text-xl font-black uppercase mt-1 ${
                      selectedAttempt.isInvalidated ? 'text-red-500' :
                      selectedAttempt.status === 'Pass' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {selectedAttempt.isInvalidated ? 'INVALID' : (selectedAttempt.status || 'Fail')}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1">{new Date(selectedAttempt.completedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Proctor Events */}
                {selectedAttempt.proctorEvents && selectedAttempt.proctorEvents.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={12} className="text-primary" /> AI Proctor Events
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedAttempt.proctorEvents.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                            ev.type === 'warning' ? 'bg-amber-400' :
                            ev.type === 'violation' ? 'bg-red-500' : 'bg-blue-400'
                          }`} />
                          <div>
                            <p className="text-[10px] font-black text-slate-700 uppercase">{ev.type || 'Event'}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{ev.message || ev.description || ''}</p>
                            {ev.timestamp && (
                              <p className="text-[8px] text-slate-400 mt-0.5 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No events */}
                {(!selectedAttempt.proctorEvents || selectedAttempt.proctorEvents.length === 0) && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
                    <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
                    <p className="text-xs font-black text-slate-700 uppercase tracking-tight">No Proctor Violations Detected</p>
                    <p className="text-[10px] text-slate-400 mt-1">This session was completed without any AI integrity flags.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default HiringExams;
