import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { API_URL } from '../../utils/api';
import { 
  Map, Target, Award, Flame, Globe2, FileText, 
  Video, ShieldCheck, Briefcase, BarChart3, Users, 
  MessageSquare, TrendingUp, DownloadCloud, BrainCircuit,
  ChevronRight, Sparkles, CheckCircle2, Lock, Star, Zap,
  Brain, Notebook, HeadphonesIcon, Trash2, X,
  Send, Download, Phone, Mail, MapPin, RefreshCw
} from 'lucide-react';

// --- SUB-COMPONENTS FOR EACH FEATURE ---

const AICareerRoadmap = () => {
  const { user } = useAuth();
  const [goal, setGoal] = useState('Solar Engineer');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      axios.get(`${API_URL}/roadmap/${user._id}`).then(res => setRoadmap(res.data.roadmap)).catch(() => {});
    }
  }, [user]);

  const generateRoadmap = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/roadmap/generate`, { userId: user?._id, careerGoal: goal });
      setRoadmap(res.data.roadmap);
      toast.success('AI Roadmap Generated Successfully!');
    } catch (err) {
      toast.error('Failed to generate roadmap');
    }
    setLoading(false);
  };

  return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI Career Roadmap</h3>
        <p className="text-sm text-slate-500 font-medium">Smart learning path generator for green careers</p>
      </div>
      <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><Map size={24} /></div>
    </div>
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <h4 className="font-bold text-slate-900 mb-4">Set Your Goal</h4>
        <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none mb-4 font-medium text-sm">
          <option value="Solar Engineer">Solar Engineer</option>
          <option value="EV Technician">EV Technician</option>
          <option value="Organic Farming Specialist">Organic Farming Specialist</option>
        </select>
        <button onClick={generateRoadmap} disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50">
          {loading ? 'Analyzing...' : roadmap ? 'Regenerate Path' : 'Generate Path'}
        </button>
      </div>
      <div className="col-span-2 bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <h4 className="font-bold text-emerald-400 mb-6 flex items-center gap-2"><Sparkles size={16} /> Projected Timeline</h4>
        <div className="space-y-4">
          {roadmap ? roadmap.milestones.map((item, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl ${item.status === 'active' ? 'bg-white/10 border border-white/20' : 'opacity-50'}`}>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs">{item.status === 'active' ? <CheckCircle2 className="text-emerald-400" /> : <Lock size={16} />}</div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{item.timeline}</p>
                <p className="font-medium text-sm">{item.title}</p>
              </div>
            </div>
          )) : (
            <div className="text-center text-slate-500 py-10 ">Select a goal and generate your personalized AI roadmap.</div>
          )}
        </div>
      </div>
    </div>
  </div>
)};

const SmartJobMatch = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [matches, setMatches] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a resume file first.');
      return;
    }
    
    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/ai/resume-match`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setExtractedSkills(res.data.extractedSkills);
      setMatches(res.data.matches);
      setAnalyzed(true);
      toast.success('Resume analyzed successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error analyzing resume');
    }
    setLoading(false);
  };

  const handleApply = async (match) => {
    if (!user) return;
    setApplyingTo(match.id);
    try {
      const endpoint = match.type === 'GeoVacancy' ? '/applications/geo-apply' : '/applications/apply';
      const payload = match.type === 'GeoVacancy' 
        ? { geoVacancyId: match.id, studentId: user._id, employerId: match.hirerId }
        : { jobId: match.id, studentId: user._id, employerId: match.hirerId, resume: 'Applied via AI Match', coverLetter: 'I am highly matched for this position.' };

      await axios.post(`${API_URL}${endpoint}`, payload);
      toast.success(`Successfully applied to ${match.organization}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    }
    setApplyingTo(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI Resume Match Engine</h3>
          <p className="text-sm text-slate-500 font-medium">Upload your resume to instantly find perfectly matched green jobs.</p>
        </div>
        <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Target size={24} /></div>
      </div>
      
      {!analyzed ? (
        <div className="bg-slate-50 p-10 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <FileText size={40} />
          </div>
          <h4 className="text-xl font-black text-slate-900 mb-2">Upload Your Resume</h4>
          <p className="text-slate-500 font-medium max-w-md mb-8">
            Upload your resume (PDF, DOC, DOCX) and our AI will extract your green skills to find real jobs that match your profile.
          </p>
          
          <div className="w-full max-w-md flex flex-col gap-4">
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              onChange={handleFileChange}
              className="w-full p-3 rounded-xl border border-slate-300 bg-white"
            />
            
            <button 
              onClick={handleUpload} 
              disabled={loading || !file}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><RefreshCw size={20} className="animate-spin" /> Analyzing...</> : <><Sparkles size={20} /> Match My Resume</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <div>
              <h4 className="font-bold text-emerald-900 mb-1">Analysis Complete</h4>
              <p className="text-sm text-emerald-700">We extracted {extractedSkills.length} green skills from your resume.</p>
            </div>
            <button 
              onClick={() => { setAnalyzed(false); setFile(null); setMatches([]); setExtractedSkills([]); }}
              className="px-4 py-2 bg-white text-emerald-700 rounded-lg font-bold text-sm shadow-sm border border-emerald-200 hover:bg-emerald-100"
            >
              Upload New Resume
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-100">
                <p className="text-slate-500 font-bold">No matching green-skill jobs found yet.</p>
                <p className="text-sm text-slate-400 mt-2">Please update your resume with more relevant skills or check again later.</p>
              </div>
            ) : (
              matches.map((match, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                        <Briefcase size={20} />
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-black text-xs border border-green-200">
                        {match.matchPercentage}% MATCH
                      </div>
                    </div>
                    <h4 className="font-black text-slate-900 text-lg leading-tight mb-1">{match.title}</h4>
                    <p className="text-slate-500 font-medium text-sm mb-4">{match.organization}</p>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="truncate">{match.location}</span>
                      </div>
                      {match.salary && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="font-bold text-emerald-600">💰</span>
                          <span className="truncate">{match.salary}</span>
                        </div>
                      )}
                    </div>

                    {match.requiredSkills && match.requiredSkills.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Required Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.requiredSkills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                              {skill}
                            </span>
                          ))}
                          {match.requiredSkills.length > 3 && (
                            <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded text-[10px] font-bold border border-slate-200">
                              +{match.requiredSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleApply(match)}
                    disabled={applyingTo === match.id}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {applyingTo === match.id ? <RefreshCw size={16} className="animate-spin" /> : 'Apply Now'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdvancedDashboard = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Career Journey Dashboard</h3>
        <p className="text-sm text-slate-500 font-medium">Advanced widgets and performance metrics</p>
      </div>
      <div className="p-3 bg-purple-100 rounded-xl text-purple-600"><BarChart3 size={24} /></div>
    </div>
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white">
        <h4 className="font-bold text-white mb-6">Learning Timeline & Growth</h4>
        <div className="h-48 flex items-end justify-between gap-2 pb-4 border-b border-white/10">
          {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
            <div key={i} className="w-full bg-white/10 rounded-t-lg hover:bg-emerald-500 transition-colors relative group" style={{ height: `${h}%` }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>
      <div className="col-span-1 space-y-6">
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
          <h4 className="font-bold text-emerald-900 mb-2">Job Readiness</h4>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-emerald-600 tracking-tighter">High</span>
            <span className="text-sm text-emerald-600 font-medium mb-1 border-b border-emerald-600/30">Top 10%</span>
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <h4 className="font-bold text-blue-900 mb-2">Goal Completion</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <span className="font-black text-blue-600">65%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);



const AdvancedStreak = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Advanced Streaks</h3>
        <p className="text-sm text-slate-500 font-medium">Bronze to Ultra Legend progression</p>
      </div>
      <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><Flame size={24} /></div>
    </div>
    <div className="bg-slate-900 p-8 rounded-[40px] text-white">
      <div className="flex items-center gap-6 mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          <Flame size={40} className="text-white drop-shadow-md" />
        </div>
        <div>
          <p className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-1">Current Tier: Gold</p>
          <h1 className="text-5xl font-black tracking-tighter">94 Days</h1>
          <p className="text-slate-400 font-medium mt-2">86 days until <span className="text-cyan-400">Diamond</span> tier</p>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="font-bold text-slate-300 uppercase tracking-widest text-xs">Activity Heatmap</h4>
        <div className="flex gap-2">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className={`w-8 h-8 rounded-md ${Math.random() > 0.3 ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const RegionalLanguageSupport = () => {
  const [activeLang, setActiveLang] = useState('en');

  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Telugu (తెలుగు)', code: 'te' },
    { name: 'Hindi (हिंदी)', code: 'hi' },
    { name: 'Tamil (தமிழ்)', code: 'ta' },
    { name: 'Kannada (ಕನ್ನಡ)', code: 'kn' },
    { name: 'Marathi (मराठी)', code: 'mr' },
    { name: 'Bengali (বাংলা)', code: 'bn' },
    { name: 'Gujarati (ગુજરાતી)', code: 'gu' }
  ];

  const handleTranslate = (langCode, langName) => {
    setActiveLang(langCode);
    const selectElement = document.querySelector('.goog-te-combo');
    if (selectElement) {
      selectElement.value = langCode;
      selectElement.dispatchEvent(new Event('change'));
      toast.success(`Platform translated to ${langName}`);
    } else {
      toast.error('Translation service loading...');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Regional Language Support</h3>
          <p className="text-sm text-slate-500 font-medium">Multilingual translation and voice instructions</p>
        </div>
        <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600"><Globe2 size={24} /></div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <h4 className="font-bold text-slate-900 mb-4">Select Global Platform Language</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {languages.map((lang, i) => (
              <button 
                key={i} 
                onClick={() => handleTranslate(lang.code, lang.name)}
                className={`p-4 rounded-2xl font-bold text-[11px] uppercase tracking-wider text-center transition-all ${activeLang === lang.code ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickToolsModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotes, setShowNotes] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  
  const [notes, setNotes] = useState(user?.notes || []);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const fetchUserTickets = async () => {
    if (!user?._id) return;
    setLoadingTickets(true);
    try {
      const res = await axios.get(`${API_URL}/tickets/user/${user._id}`);
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch user tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (showTickets && user?._id) {
      fetchUserTickets();
    }
  }, [showTickets, user]);

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/auth/users/${user._id}/notes`, { title: newNoteTitle, content: newNoteContent });
      setNotes(res.data.notes);
      setNewNoteTitle('');
      setNewNoteContent('');
      toast.success('Note saved successfully!');
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const res = await axios.delete(`${API_URL}/auth/users/${user._id}/notes/${noteId}`);
      setNotes(res.data.notes);
      toast.success('Note deleted!');
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketDesc.trim()) {
      toast.error('Subject and description required');
      return;
    }
    try {
      await axios.post(`${API_URL}/tickets`, {
        userId: user?._id || user?.id,
        type: 'support',
        category: 'general',
        subject: ticketSubject,
        description: ticketDesc
      });
      setTicketSubject('');
      setTicketDesc('');
      toast.success('Support ticket submitted successfully!');
      fetchUserTickets();
    } catch (err) {
      toast.error('Failed to submit ticket. Please check server connection.');
    }
  };

  const handleUnsendTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to unsend this support ticket?")) return;
    try {
      await axios.delete(`${API_URL}/tickets/${ticketId}`);
      toast.success('Ticket unsent successfully!');
      fetchUserTickets();
    } catch (err) {
      console.error(err);
      toast.error('Failed to unsend ticket. Please check connection.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Quick Tools</h3>
          <p className="text-sm text-slate-500 font-medium">Access your Notebook, Quiz, and Support directly</p>
        </div>
        <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><Brain size={24} /></div>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <button onClick={() => setShowNotes(true)} className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-yellow-50 hover:bg-yellow-100 text-yellow-600 transition-all border border-yellow-100">
            <Notebook size={32} />
            <span className="text-sm font-black tracking-widest uppercase mt-2">Notebook</span>
          </button>
          <button onClick={() => navigate('/dashboard/quiz')} className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all border border-blue-100">
            <Award size={32} />
            <span className="text-sm font-black tracking-widest uppercase mt-2">Quiz</span>
          </button>
          <button onClick={() => setShowTickets(true)} className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all border border-slate-200">
            <HeadphonesIcon size={32} />
            <span className="text-sm font-black tracking-widest uppercase mt-2">Support</span>
          </button>
        </div>
      </div>

      {/* Notes Slide-over Modal */}
      <AnimatePresence>
        {showNotes && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-yellow-50">
                <div className="flex items-center gap-3 text-yellow-700">
                  <Notebook size={24} />
                  <h2 className="text-xl font-bold">My Notebook</h2>
                </div>
                <button onClick={() => setShowNotes(false)} className="text-yellow-700/50 hover:text-yellow-700 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <input 
                    type="text" 
                    placeholder="Note Title..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-bold text-slate-900 placeholder:text-slate-400"
                  />
                  <textarea 
                    placeholder="Write your thoughts, ideas, or study notes..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full bg-transparent border-none outline-none resize-none h-24 text-sm text-slate-600 placeholder:text-slate-400"
                  ></textarea>
                  <div className="flex justify-end">
                    <button onClick={handleSaveNote} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-yellow-500/20">
                      Save Note
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saved Notes</h3>
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <div key={note._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group">
                        <button onClick={() => handleDeleteNote(note._id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={16} />
                        </button>
                        <h4 className="font-bold text-slate-900 mb-2 pr-6">{note.title}</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-medium ">
                      Your notebook is empty.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Support Tickets Modal */}
      <AnimatePresence>
        {showTickets && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-3 text-white">
                  <HeadphonesIcon size={24} />
                  <h2 className="text-xl font-bold">Help & Support</h2>
                </div>
                <button onClick={() => setShowTickets(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="font-bold text-slate-900">Raise a Ticket</h4>
                  <input 
                    type="text" 
                    placeholder="Issue Subject..."
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-bold text-sm text-slate-900 placeholder:text-slate-400"
                  />
                  <textarea 
                    placeholder="Describe your issue in detail..."
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none resize-none h-32 text-sm text-slate-600 placeholder:text-slate-400"
                  ></textarea>
                  <div className="flex justify-end">
                    <button onClick={handleCreateTicket} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors">
                      Submit Ticket
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Tickets</h3>
                  {loadingTickets ? (
                    <div className="text-center py-6">
                      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : tickets.length > 0 ? (
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <div key={ticket._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ticket.category}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                ticket.status === 'closed' ? 'bg-slate-200 text-slate-600 border-slate-300' :
                                ticket.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-indigo-50 text-indigo-600 border-indigo-100'
                              }`}>
                                {ticket.status}
                              </span>
                              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                <button 
                                  onClick={() => handleUnsendTicket(ticket._id)}
                                  className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest hover:underline cursor-pointer transition-colors bg-white px-2 py-1 rounded border border-rose-200/40 hover:border-rose-300 hover:bg-rose-50/50"
                                >
                                  Unsend
                                </button>
                              )}
                            </div>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{ticket.subject}</h4>
                          <p className="text-xs text-slate-600 line-clamp-2">{ticket.description}</p>
                          {ticket.responses && ticket.responses.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-2">
                              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Responses:</p>
                              {ticket.responses.map((resp, idx) => (
                                <div key={resp._id || idx} className="bg-white p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700">
                                  <p className="font-semibold text-slate-800 mb-0.5">{resp.responder?.name || 'Agent'} ({resp.responder?.role || 'support'}):</p>
                                  <p className="text-slate-600">{resp.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-right mt-1">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-medium ">
                      You have no active support tickets.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getMockResume = (userData, refinementPrompt) => {
  if (refinementPrompt && typeof userData === 'object') {
    const updated = { ...userData };
    const p = refinementPrompt.toLowerCase();
    
    if (p.includes('phone')) {
      const match = refinementPrompt.match(/\+?\d[\d-\s]{7,15}/);
      if (match) updated.phone = match[0];
    }
    if (p.includes('email')) {
      const match = refinementPrompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) updated.email = match[0];
    }
    if (p.includes('location')) {
      updated.location = refinementPrompt.replace(/.*location\s+(to\s+)?/i, '').trim();
    }
    if (p.includes('skill')) {
      const newSkill = refinementPrompt.replace(/.*add\s+skill\s+/i, '').replace(/.*add\s+/i, '').trim();
      if (newSkill && updated.skills) {
        updated.skills.push({ name: newSkill, level: 85 });
      }
    }
    if (p.includes('project')) {
      const newProj = refinementPrompt.replace(/.*add\s+project\s+/i, '').replace(/.*add\s+/i, '').trim();
      if (newProj && updated.projects) {
        updated.projects.push({
          name: newProj,
          technologies: ["React", "Tailwind", "Node.js"],
          description: "A premium solution built for scale and recruiter visibility.",
          bulletPoints: [
            "Engineered high performance architecture reducing latency by 35%.",
            "Deployed cloud infrastructure supporting over 1,500 active requests.",
            "Integrated modern responsive UI with fluid user experiences."
          ]
        });
      }
    }
    
    if (p.includes('more technical') || p.includes('professional') || p.includes('improve')) {
      updated.summary = "Highly motivated and results-driven professional specializing in developing cutting-edge web applications and green energy systems. Adept at leveraging modern technology stacks to deliver scalable, high-performance solutions while maintaining exceptional user experiences.";
      if (updated.experience && updated.experience[0]) {
        updated.experience[0].bulletPoints = [
          "Developed responsive web interfaces utilizing modern framework components, resulting in 40% user engagement growth.",
          "Collaborated with cross-functional product and engineering teams to deploy automated build pipelines.",
          "Optimized backend database performance, decreasing query latency by 20% across main user flows."
        ];
      }
      if (updated.ats) {
        updated.ats.score = Math.min(99, updated.ats.score + 5);
        updated.ats.readabilityScore = Math.min(100, updated.ats.readabilityScore + 3);
      }
    }
    
    return updated;
  }

  const name = userData.name || "Alex Mercer";
  const title = userData.desiredRole || "Junior Green Energy Developer";
  const phone = userData.phone || "+91 98765 43210";
  const email = userData.email || "alex.mercer@gmail.com";
  const location = userData.location || "Bangalore, India";
  const linkedin = userData.linkedin || "linkedin.com/in/alexmercer";
  const github = userData.github || "github.com/alexmercer";
  const portfolio = userData.portfolio || "alexmercer.dev";
  
  const skillsList = (userData.skills || "JavaScript, React, Node.js, HTML/CSS, Git, Python, Clean Energy Tech")
    .split(',')
    .map(s => ({ name: s.trim(), level: Math.floor(Math.random() * 20) + 75 }));
    
  const languagesList = (userData.languages || "English, Telugu, Hindi")
    .split(',')
    .map(l => ({ name: l.trim(), level: l.trim().toLowerCase() === 'english' ? 'Fluent' : 'Native' }));

  return {
    name,
    title,
    phone,
    email,
    location,
    linkedin,
    github,
    portfolio,
    summary: `Dynamic and detail-oriented ${title} with a solid foundation in modern development environments and green technology integration. Committed to optimizing software systems and driving eco-friendly sustainability solutions in fast-paced collaborative teams.`,
    experience: [
      {
        company: userData.currentCompany || "EcoTech Innovations",
        role: userData.currentDesignation || title,
        duration: "2024 - Present",
        bulletPoints: [
          "Spearheaded redesign of carbon calculation platform using React and Node.js, improving load efficiency by 30%.",
          "Automated server deployment configurations, mitigating system downtime by 15% and increasing developer velocity.",
          "Authored robust modular API documentations, fostering seamless integration flows for external stakeholder tools."
        ]
      }
    ],
    projects: [
      {
        name: userData.projectName || "Smart Grid Power Estimator",
        technologies: (userData.projectTech || "React, Express, MongoDB, Python").split(',').map(s => s.trim()),
        description: userData.projectDesc || "A machine learning and responsive web project designed to measure and estimate solar output efficiency based on local meteorological arrays.",
        bulletPoints: [
          "Developed responsive dashboard UI visualizing solar panel energy metrics with clean interactive graphs.",
          "Integrated predictive analysis models yielding 94% accuracy in quarterly grid capacity calculations.",
          "Optimized database indexing strategies reducing query load speeds under heavy search stress."
        ]
      }
    ],
    education: [
      {
        degree: userData.degree || "B.Tech in Computer Science",
        institution: userData.university || "Global Institute of Technology",
        year: userData.graduationYear || "2024",
        cgpa: userData.cgpa || "8.5 CGPA"
      }
    ],
    skills: skillsList,
    languages: languagesList,
    certifications: (userData.certifications || "Certified Green Developer, AWS Cloud Practitioner").split(',').map(c => c.trim()),
    achievements: [
      "Winner of Eco-Hackathon 2024 out of 120 global technical teams.",
      "Published review article on local solar grid efficiency and smart storage."
    ],
    references: [
      {
        name: "Dr. Ramesh Babu",
        designation: "Professor & Head of Green Technologies",
        company: userData.university || "Global Institute of Technology",
        email: "ramesh.babu@git.edu",
        phone: "+91 99887 76655"
      }
    ],
    ats: {
      score: 95,
      missingKeywords: ["TypeScript", "AWS Lambda", "CI/CD Pipelines", "Docker"],
      suggestions: [
        "Include more quantifiable metrics in your project metrics.",
        "Add TypeScript to your technical skills to improve matches for Modern Frontend roles."
      ],
      readabilityScore: 94
    },
    coverLetter: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${title} position at your esteemed organization. With my academic background and hands-on experience in building modern web platforms, I am eager to contribute to your engineering team.\n\nDuring my work, I successfully developed scalable software solutions and automated system configurations. I am confident that my technical skills in web architecture and my passion for sustainable engineering make me an ideal fit.\n\nThank you for your time and consideration. I look forward to discussing how my skills align with your team's goals.\n\nSincerely,\n${name}`,
    interviewPrep: [
      {
        question: "Tell me about a challenging project you worked on.",
        answer: "Describe the Smart Grid Power Estimator. Explain the challenge of aggregating meteorological data, the solution of writing optimized Mongo index queries, and the result of achieving 94% estimation accuracy."
      },
      {
        question: "How do you optimize React application performance?",
        answer: "Talk about component memoization, lazy loading of subcomponents, profile analyzer metrics, and reducing unnecessary state re-renders."
      }
    ],
    linkedin,
    linkedinOpt: {
      headline: `${title} | React & Node.js Developer | Specializing in Sustainable Tech Solutions`,
      about: `Passionate ${title} dedicated to constructing highly scalable, clean, and sustainable web applications. Experienced in JavaScript frameworks and cloud deployment automation. Let's connect to build greener tech!`
    }
  };
};

const AIResumeBuilder = () => {
  const { user } = useAuth();
  const [stage, setStage] = useState('collecting'); // 'collecting' | 'generating' | 'previewing'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [inputVal, setInputVal] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { isBot: true, text: "Hi! I am your AI Resume Recruiter. I will help you build a professional, 95%+ ATS-friendly corporate resume. Let's start with your Full Name?" }
  ]);
  
  // Preview States
  const [resumeData, setResumeData] = useState(null);
  const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'ats' | 'coverLetter' | 'linkedin' | 'interview'
  const [refineText, setRefineText] = useState('');
  const [loadingRefine, setLoadingRefine] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);

  // Resize logic for precise A4 fitting without scrollbars
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setScale(Math.min(1, width / 794)); // Never scale up beyond actual A4 size, only scale down
      }
    };
    updateScale();
    // Use a small timeout to let React render the DOM first
    setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [stage, activeTab]);

  const questionsList = [
    { key: 'name', label: 'Full Name', category: 'Personal Information', placeholder: 'e.g. Alex Mercer' },
    { key: 'phone', label: 'Mobile Number', category: 'Personal Information', placeholder: 'e.g. +91 98765 43210' },
    { key: 'email', label: 'Email Address', category: 'Personal Information', placeholder: 'e.g. alex@example.com' },
    { key: 'location', label: 'Current Location', category: 'Personal Information', placeholder: 'e.g. Bangalore, India' },
    { key: 'linkedin', label: 'LinkedIn Profile (Optional)', category: 'Personal Information', placeholder: 'e.g. linkedin.com/in/username' },
    { key: 'github', label: 'GitHub Profile (Optional)', category: 'Personal Information', placeholder: 'e.g. github.com/username' },
    { key: 'portfolio', label: 'Portfolio Website (Optional)', category: 'Personal Information', placeholder: 'e.g. username.dev' },
    
    { key: 'desiredRole', label: 'Desired Job Role', category: 'Professional Information', placeholder: 'e.g. Solar Design Engineer' },
    { key: 'careerObjective', label: 'Career Objective', category: 'Professional Information', placeholder: 'e.g. Focused on driving green technology integration.' },
    { key: 'totalExperience', label: 'Total Experience', category: 'Professional Information', placeholder: 'e.g. 2 years' },
    { key: 'currentCompany', label: 'Current Company', category: 'Professional Information', placeholder: 'e.g. EcoTech Innovations' },
    { key: 'currentDesignation', label: 'Current Designation', category: 'Professional Information', placeholder: 'e.g. Associate Engineer' },

    { key: 'degree', label: 'Education Degree', category: 'Education', placeholder: 'e.g. B.Tech in Computer Science' },
    { key: 'university', label: 'College / University', category: 'Education', placeholder: 'e.g. Global Institute of Tech' },
    { key: 'graduationYear', label: 'Graduation Year', category: 'Education', placeholder: 'e.g. 2024' },
    { key: 'cgpa', label: 'CGPA / Percentage', category: 'Education', placeholder: 'e.g. 8.5 CGPA' },

    { key: 'projectName', label: 'Project Name', category: 'Projects', placeholder: 'e.g. Smart Grid Estimator' },
    { key: 'projectTech', label: 'Project Technologies', category: 'Projects', placeholder: 'e.g. React, Node.js, Python' },
    { key: 'projectDesc', label: 'Project Description', category: 'Projects', placeholder: 'e.g. ML estimates of solar output.' },

    { key: 'skills', label: 'Technical Skills (comma separated)', category: 'Skills', placeholder: 'e.g. React, Node.js, Python, Git' },
    { key: 'languages', label: 'Languages (comma separated)', category: 'Languages', placeholder: 'e.g. English, Telugu, Hindi' },
    { key: 'certifications', label: 'Certifications (comma separated)', category: 'Certifications', placeholder: 'e.g. AWS Cloud Practitioner' }
  ];

  const handleAutofill = () => {
    if (!user) return;
    const filled = {
      name: user.name || 'Alex Mercer',
      email: user.email || 'alex.mercer@gmail.com',
      skills: user.skillsInterested?.join(', ') || 'React, Node.js, Python, GIS, Clean Energy',
      languages: 'English, Telugu, Hindi',
      location: 'Hyderabad, India',
      desiredRole: user.careerGoal || 'Green Tech Developer',
      degree: 'B.Tech in Computer Science',
      university: 'GITAM University',
      graduationYear: '2024',
      cgpa: '8.5 CGPA',
      phone: '+91 99887 76655',
      currentCompany: 'EcoTech Innovations',
      currentDesignation: 'Junior Developer',
      projectName: 'Carbon Footprint Calculator',
      projectTech: 'React, Node.js, MongoDB',
      projectDesc: 'A web-based carbon estimator yielding high accuracy calculations.'
    };
    setAnswers(filled);
    setStage('generating');
    triggerGenerator(filled);
  };

  const handleSendResponse = (val) => {
    const text = val || inputVal;
    if (!text.trim()) return;

    const currentQuestion = questionsList[currentStep];
    const newAnswers = { ...answers, [currentQuestion.key]: text };
    setAnswers(newAnswers);
    setInputVal('');

    const updatedHistory = [
      ...chatHistory,
      { isBot: false, text }
    ];

    if (currentStep < questionsList.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updatedHistory.push({
        isBot: true,
        text: `Got it! Next, what is your ${questionsList[nextStep].label}?`
      });
      setChatHistory(updatedHistory);
    } else {
      updatedHistory.push({
        isBot: true,
        text: "Thank you! I have collected all necessary details. Generating your optimized ATS resume now..."
      });
      setChatHistory(updatedHistory);
      
      setTimeout(() => {
        setStage('generating');
        triggerGenerator(newAnswers);
      }, 1000);
    }
  };

  const triggerGenerator = async (data) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setGeneratingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 250);

    try {
      const res = await axios.post(`${API_URL}/ai/resume`, {
        userId: user?._id || user?.id,
        userData: data
      });
      clearInterval(interval);
      setGeneratingProgress(100);
      setResumeData(res.data.resume);
      setStage('previewing');
    } catch (err) {
      clearInterval(interval);
      toast.error("Generation failed. Loading fallback template.");
      // Dynamically fetch mock template on client fallback
      const mockResult = getMockResume(data);
      setResumeData(mockResult);
      setStage('previewing');
    }
  };

  const handleRefineResume = async () => {
    if (!refineText.trim()) return;
    setLoadingRefine(true);
    try {
      const res = await axios.post(`${API_URL}/ai/resume`, {
        userId: user?._id || user?.id,
        userData: resumeData,
        refinementPrompt: refineText
      });
      setResumeData(res.data.resume);
      setRefineText('');
      toast.success('Resume updated successfully!');
    } catch (err) {
      toast.error('Failed to apply edits');
    } finally {
      setLoadingRefine(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = () => {
    let content = `# RESUME - ${resumeData.name}\n\n`;
    content += `Title: ${resumeData.title}\n`;
    content += `Contact: ${resumeData.phone} | ${resumeData.email} | ${resumeData.location}\n\n`;
    content += `## Professional Summary\n${resumeData.summary}\n\n`;
    content += `## Skills\n`;
    resumeData.skills.forEach(s => {
      content += `- ${s.name}: ${s.level}%\n`;
    });
    content += `\n## Experience\n`;
    resumeData.experience.forEach(exp => {
      content += `### ${exp.role} - ${exp.company} (${exp.duration})\n`;
      exp.bulletPoints.forEach(pt => {
        content += `- ${pt}\n`;
      });
    });
    
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${resumeData.name.replace(/\s+/g, '_')}_resume.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Markdown / Word compatible CV downloaded!");
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentStep(0);
    setInputVal('');
    setChatHistory([
      { isBot: true, text: "Let's restart the wizard! What is your Full Name?" }
    ]);
    setStage('collecting');
    setGeneratingProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI Resume Builder</h3>
          <p className="text-sm text-slate-500 font-medium">Auto-generate recruiter-approved ATS resumes</p>
        </div>
        <div className="p-3 bg-rose-100 rounded-xl text-rose-600"><FileText size={24} /></div>
      </div>

      {/* STAGE 1: Collecting Details via Chat */}
      {stage === 'collecting' && (
        <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-sm max-w-4xl mx-auto no-print">
          <div className="space-y-4 flex flex-col h-[500px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`p-4 rounded-2xl max-w-[85%] text-sm font-semibold leading-relaxed ${
                    msg.isBot ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-rose-500 text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Progress</span>
                <span>{Math.round((currentStep / questionsList.length) * 100)}%</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 transition-all duration-350" style={{ width: `${(currentStep / questionsList.length) * 100}%` }}></div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder={questionsList[currentStep].placeholder}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendResponse()}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
              />
              <button onClick={() => handleSendResponse()} className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: Generating Resume Progress Animation */}
      {stage === 'generating' && (
        <div className="bg-slate-900 p-8 sm:p-12 rounded-[40px] text-white flex flex-col items-center justify-center text-center h-[500px] no-print">
          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6 animate-pulse border-4 border-rose-500/20">
            <BrainCircuit size={40} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase ">Synthesizing Credentials</h2>
          <p className="text-slate-400 font-medium mt-2 max-w-sm mb-8 text-sm">
            {generatingProgress < 40 ? "Enhancing achievements vocabulary..." :
             generatingProgress < 70 ? "Mapping industry-standard green keywords..." :
             "Injecting corporate templates and computing ATS benchmarks..."}
          </p>
          <div className="w-full max-w-md bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${generatingProgress}%` }}></div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">{generatingProgress}% Complete</span>
        </div>
      )}

      {/* STAGE 3: Resume Inspection / Double Pane Preview */}
      {stage === 'previewing' && resumeData && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Panel: Adjuster & Tabs */}
          <div className="xl:col-span-4 space-y-6 no-print">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs">AI Copilot Refinement</h4>
              <p className="text-xs text-slate-500 font-medium">Type requests to customize sections instantly:</p>
              
              <div className="flex gap-2">
                <textarea 
                  placeholder="e.g. Add Python to skills, change phone to +91..."
                  value={refineText}
                  onChange={(e) => setRefineText(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none resize-none h-16"
                ></textarea>
              </div>
              <button 
                onClick={handleRefineResume}
                disabled={loadingRefine}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loadingRefine ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles size={14} className="text-yellow-400" /> Apply Revision
                  </>
                )}
              </button>
            </div>

            {/* Interactive Tabs */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs px-2 mb-3">Sections & Tools</h4>
              {[
                { id: 'resume', label: 'Resume Preview', icon: FileText },
                { id: 'ats', label: 'ATS Optimization', icon: ShieldCheck },
                { id: 'coverLetter', label: 'Cover Letter', icon: Notebook },
                { id: 'linkedin', label: 'LinkedIn Headline & About', icon: Globe2 },
                { id: 'interview', label: 'Interview Preparation', icon: MessageSquare }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === tab.id 
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handlePrint} className="py-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10">
                <Download size={14} /> Download PDF
              </button>
              <button onClick={handleDownloadDocx} className="py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
                <FileText size={14} /> Export MD
              </button>
            </div>
            <button onClick={handleRestart} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Restart Wizard
            </button>
          </div>

          {/* Right Panel: The Resume Viewer */}
          <div className="xl:col-span-8">
            
            {/* TABS CONTAINER */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-10">
              
              {/* Tab 1: Live Resume rendering */}
              {activeTab === 'resume' && (
                <div 
                  ref={containerRef}
                  className="w-full max-w-[794px] mx-auto overflow-hidden rounded-lg shadow-lg bg-slate-50 border border-slate-200 relative"
                  style={{ height: `${1123 * scale}px` }}
                >
                  <div 
                    className="resume-print-container bg-white text-[#2F3B52] overflow-hidden font-opensans flex flex-col absolute top-0 left-0 origin-top-left" 
                    style={{ 
                      width: '794px', 
                      height: '1123px',
                      transform: `scale(${scale})`
                    }}
                  >
                    {/* Top Header: Dark Navy Header #2F3B52 */}
                    <div className="bg-[#2F3B52] text-white py-12 px-8 text-center space-y-2 relative font-montserrat shrink-0">
                      <h1 className="text-5xl font-black uppercase tracking-[0.15em] leading-none">{resumeData.name}</h1>
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em] font-poppins">{resumeData.title}</p>
                    </div>

                    {/* Two Column Body */}
                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    
                    {/* Left Gray Sidebar: #E5E7EB */}
                    <div className="w-full md:w-[32%] bg-[#E5E7EB] p-6 space-y-8 border-r border-slate-300 shrink-0 font-opensans">
                      {/* CONTACT */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black text-[#2F3B52] uppercase tracking-[0.2em] border-b border-[#2F3B52] pb-1 font-poppins">CONTACT</h4>
                        <div className="text-[10px] text-[#2F3B52] space-y-2.5 font-bold leading-relaxed break-all">
                          {resumeData.phone && (
                            <div className="flex items-center gap-2.5">
                              <Phone size={12} className="text-[#2F3B52] shrink-0" />
                              <span>{resumeData.phone}</span>
                            </div>
                          )}
                          {resumeData.email && (
                            <div className="flex items-center gap-2.5">
                              <Mail size={12} className="text-[#2F3B52] shrink-0" />
                              <span>{resumeData.email}</span>
                            </div>
                          )}
                          {resumeData.location && (
                            <div className="flex items-center gap-2.5">
                              <MapPin size={12} className="text-[#2F3B52] shrink-0" />
                              <span>{resumeData.location}</span>
                            </div>
                          )}
                          {resumeData.linkedin && (
                            <div className="flex items-center gap-2.5">
                              <Globe2 size={12} className="text-[#2F3B52] shrink-0" />
                              <span>{resumeData.linkedin}</span>
                            </div>
                          )}
                          {resumeData.github && (
                            <div className="flex items-center gap-2.5">
                              <Globe2 size={12} className="text-[#2F3B52] shrink-0" />
                              <span>{resumeData.github}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SKILLS */}
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-[#2F3B52] uppercase tracking-[0.2em] border-b border-[#2F3B52] pb-1 font-poppins">SKILLS</h4>
                        <div className="space-y-3">
                          {resumeData.skills?.map((skill, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-[#2F3B52] uppercase tracking-wide">
                                <span>{skill.name}</span>
                                <span>{skill.level}%</span>
                              </div>
                              <div className="h-1.5 bg-white rounded-full border border-[#2F3B52]/10 overflow-hidden">
                                <div className="h-full bg-[#2F3B52]" style={{ width: `${skill.level}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* LANGUAGES */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black text-[#2F3B52] uppercase tracking-[0.2em] border-b border-[#2F3B52] pb-1 font-poppins">LANGUAGES</h4>
                        <div className="text-[10px] text-[#2F3B52] font-bold space-y-1.5 uppercase tracking-wider">
                          {resumeData.languages?.map((lang, i) => (
                            <p key={i}>{lang.name} — <span className="text-slate-600 font-medium">{lang.level}</span></p>
                          ))}
                        </div>
                      </div>

                      {/* CERTIFICATIONS */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black text-[#2F3B52] uppercase tracking-[0.2em] border-b border-[#2F3B52] pb-1 font-poppins">CERTIFICATIONS</h4>
                        <ul className="text-[10px] text-[#2F3B52] font-bold space-y-1.5 list-disc pl-3 leading-relaxed">
                          {resumeData.certifications?.map((cert, i) => (
                            <li key={i}>{cert}</li>
                          ))}
                        </ul>
                      </div>

                      {/* REFERENCES */}
                      {resumeData.references && resumeData.references[0] && (
                        <div className="space-y-3">
                          <h4 className="text-[11px] font-black text-[#2F3B52] uppercase tracking-[0.2em] border-b border-[#2F3B52] pb-1 font-poppins">REFERENCE</h4>
                          <div className="text-[10px] text-slate-700 leading-relaxed font-bold space-y-1">
                            <p className="text-[#2F3B52] uppercase font-bold">{resumeData.references[0].name}</p>
                            <p className="text-slate-500 font-medium">{resumeData.references[0].designation} — {resumeData.references[0].company}</p>
                            <p className="mt-1"><span className="text-[#2F3B52] font-medium">Phone:</span> {resumeData.references[0].phone}</p>
                            <p><span className="text-[#2F3B52] font-medium">Email :</span> {resumeData.references[0].email}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Main Timeline Content: White Background */}
                    <div className="flex-1 p-8 relative bg-white text-[#2F3B52] font-opensans">
                      {/* Continuous Timeline vertical line */}
                      <div className="absolute left-[30px] top-10 bottom-10 w-[2px] bg-[#2F3B52]/20 no-print"></div>

                      {/* PROFILE */}
                      <div className="relative pl-16 mb-8">
                        {/* Circular Icon node centered on timeline */}
                        <div className="absolute left-[14px] top-[-4px] w-8 h-8 rounded-full bg-[#2F3B52] text-white flex items-center justify-center border-4 border-white shadow-sm no-print">
                          <Users size={14} />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className="text-sm font-poppins font-black uppercase tracking-[0.15em] text-[#2F3B52] shrink-0">
                            PROFILE
                          </h4>
                          <div className="flex-1 h-[1.5px] bg-[#2F3B52]/80"></div>
                        </div>
                        
                        <p className="text-xs text-slate-650 font-medium leading-relaxed">
                          {resumeData.summary}
                        </p>
                      </div>

                      {/* WORK EXPERIENCE */}
                      <div className="relative pl-16 mb-8">
                        {/* Circular Icon node centered on timeline */}
                        <div className="absolute left-[14px] top-[-4px] w-8 h-8 rounded-full bg-[#2F3B52] text-white flex items-center justify-center border-4 border-white shadow-sm no-print">
                          <Briefcase size={14} />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className="text-sm font-poppins font-black uppercase tracking-[0.15em] text-[#2F3B52] shrink-0">
                            WORK EXPERIENCE
                          </h4>
                          <div className="flex-1 h-[1.5px] bg-[#2F3B52]/80"></div>
                        </div>
                        
                        <div className="space-y-6">
                          {resumeData.experience?.map((exp, i) => (
                            <div key={i} className="relative pl-6">
                              {/* Smaller timeline node */}
                              <div className="absolute left-[-40px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#2F3B52] shadow-sm no-print"></div>
                              
                              <div className="flex justify-between items-start text-xs mb-1">
                                <div>
                                  <h5 className="font-poppins font-bold text-[#2F3B52] text-sm uppercase leading-tight">{exp.role}</h5>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{exp.company}</p>
                                </div>
                                <span className="text-[10px] font-bold text-[#2F3B52] bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">{exp.duration}</span>
                              </div>
                              <ul className="list-disc pl-4 text-[11px] text-slate-600 font-medium space-y-1 leading-relaxed">
                                {exp.bulletPoints?.map((pt, idx) => (
                                  <li key={idx}>{pt}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PROJECTS */}
                      <div className="relative pl-16 mb-8">
                        {/* Circular Icon node centered on timeline */}
                        <div className="absolute left-[14px] top-[-4px] w-8 h-8 rounded-full bg-[#2F3B52] text-white flex items-center justify-center border-4 border-white shadow-sm no-print">
                          <BrainCircuit size={14} />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className="text-sm font-poppins font-black uppercase tracking-[0.15em] text-[#2F3B52] shrink-0">
                            PROJECTS
                          </h4>
                          <div className="flex-1 h-[1.5px] bg-[#2F3B52]/80"></div>
                        </div>
                        
                        <div className="space-y-6">
                          {resumeData.projects?.map((proj, i) => (
                            <div key={i} className="relative pl-6">
                              {/* Smaller timeline node */}
                              <div className="absolute left-[-40px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#2F3B52] shadow-sm no-print"></div>
                              
                              <div className="space-y-1">
                                <h5 className="font-poppins font-bold text-[#2F3B52] text-xs uppercase leading-tight">{proj.name}</h5>
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                  Technologies: {proj.technologies?.join(', ')}
                                </p>
                                <p className="text-[11px] text-slate-650 font-medium leading-relaxed">
                                  {proj.description}
                                </p>
                                <ul className="list-disc pl-4 text-[10px] text-slate-500 font-medium space-y-0.5 leading-relaxed">
                                  {proj.bulletPoints?.map((pt, idx) => (
                                    <li key={idx}>{pt}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* EDUCATION */}
                      <div className="relative pl-16">
                        {/* Circular Icon node centered on timeline */}
                        <div className="absolute left-[14px] top-[-4px] w-8 h-8 rounded-full bg-[#2F3B52] text-white flex items-center justify-center border-4 border-white shadow-sm no-print">
                          <Award size={14} />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className="text-sm font-poppins font-black uppercase tracking-[0.15em] text-[#2F3B52] shrink-0">
                            EDUCATION
                          </h4>
                          <div className="flex-1 h-[1.5px] bg-[#2F3B52]/80"></div>
                        </div>
                        
                        <div className="space-y-6">
                          {resumeData.education?.map((edu, i) => (
                            <div key={i} className="relative pl-6">
                              {/* Smaller timeline node */}
                              <div className="absolute left-[-40px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#2F3B52] shadow-sm no-print"></div>
                              
                              <div className="flex justify-between items-start text-[11px] font-bold text-slate-700">
                                <div>
                                  <h5 className="text-[#2F3B52] uppercase font-poppins font-bold text-xs">{edu.degree}</h5>
                                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px] mt-0.5">{edu.institution}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] text-[#2F3B52] bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{edu.year}</span>
                                  <p className="text-slate-500 font-medium mt-1">{edu.cgpa}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                </div>
              )}

              {/* Tab 2: ATS Optimization */}
              {activeTab === 'ats' && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">ATS Performance Optimizer</h3>
                  
                  {/* Score Bento */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center">
                      <div className="w-32 h-32 rounded-full border-[10px] border-slate-200 border-t-rose-500 flex items-center justify-center relative mb-4">
                        <div>
                          <h1 className="text-3xl font-black text-slate-900">{resumeData.ats?.score || 95}%</h1>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ATS Score</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Overall ATS Score</p>
                    </div>

                    <div className="col-span-2 space-y-4">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                        <h4 className="font-bold text-slate-900 text-sm uppercase">Recruiter Readability Score</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resumeData.ats?.readabilityScore || 94}%` }}></div>
                          </div>
                          <span className="font-black text-emerald-600 text-sm">{resumeData.ats?.readabilityScore || 94}%</span>
                        </div>
                      </div>

                      <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-semibold leading-relaxed">
                        ✓ Resume includes action-driven metrics and matches 95%+ of industry hiring standards.
                      </div>
                    </div>
                  </div>

                  {/* Missing Keywords & Suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100/50 space-y-4">
                      <h4 className="font-bold text-rose-800 text-sm uppercase">Missing Keywords (Suggested)</h4>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.ats?.missingKeywords?.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-white border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm uppercase">Improvement Checklist</h4>
                      <ul className="text-xs text-slate-600 font-medium space-y-2 list-decimal pl-4">
                        {resumeData.ats?.suggestions?.map((sug, i) => (
                          <li key={i}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Cover Letter */}
              {activeTab === 'coverLetter' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Personalized Cover Letter</h3>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(resumeData.coverLetter);
                        toast.success('Cover Letter copied!');
                      }}
                      className="px-4 py-2 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Copy Cover Letter
                    </button>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {resumeData.coverLetter}
                  </div>
                </div>
              )}

              {/* Tab 4: LinkedIn Headline & About */}
              {activeTab === 'linkedin' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">LinkedIn Optimization</h3>
                  
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 text-sm uppercase">LinkedIn Headline</h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(resumeData.linkedinOpt?.headline);
                          toast.success('Headline copied!');
                        }}
                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 font-bold bg-white p-3 rounded-xl border border-slate-200">
                      {resumeData.linkedinOpt?.headline}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 text-sm uppercase">LinkedIn About Section</h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(resumeData.linkedinOpt?.about);
                          toast.success('About text copied!');
                        }}
                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-650 font-medium bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
                      {resumeData.linkedinOpt?.about}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 5: Interview Preparation */}
              {activeTab === 'interview' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI Interview Preparation Guide</h3>
                  <p className="text-sm text-slate-500 font-medium">Top interview questions and suggested responses based on your resume:</p>
                  
                  <div className="space-y-4">
                    {resumeData.interviewPrep?.map((prep, i) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <h4 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-black">Q</span>
                          {prep.question}
                        </h4>
                        <p className="text-xs text-slate-650 font-medium leading-relaxed pl-7">
                          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">Suggested Answer:</span>
                          {prep.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AIInterviewPrep = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI Interview Prep</h3>
        <p className="text-sm text-slate-500 font-medium">Mock voice interviews with immediate scoring</p>
      </div>
      <div className="p-3 bg-cyan-100 rounded-xl text-cyan-600"><Video size={24} /></div>
    </div>
    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-center">
      <div className="w-24 h-24 bg-cyan-100 text-cyan-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner border-4 border-white">
        <Video size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Start Mock Interview</h2>
      <p className="text-slate-500 font-medium max-w-md mx-auto mt-2 mb-8">Practice with our AI recruiter. Choose between Technical or HR rounds.</p>
      <div className="flex justify-center gap-4">
        <button onClick={() => toast.success('Initializing Voice AI for Technical Interview...')} className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-cyan-600 transition-colors">Technical Round</button>
        <button onClick={() => toast.success('Initializing Voice AI for HR Interview...')} className="px-8 py-4 bg-white text-slate-900 border border-slate-200 font-bold rounded-2xl hover:bg-slate-100 transition-colors">HR Round</button>
      </div>
    </div>
  </div>
);

const CompanyTrustSystem = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Verified Company Trust</h3>
        <p className="text-sm text-slate-500 font-medium">Reliability ratings and hiring success rates</p>
      </div>
      <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><ShieldCheck size={24} /></div>
    </div>
    <div className="grid grid-cols-1 gap-4">
      {[
        { name: 'EcoTech Innovations', score: 98, success: '94%', verified: true },
        { name: 'Solaris India', score: 92, success: '88%', verified: true },
        { name: 'GreenWay Logistics', score: 85, success: '76%', verified: false },
      ].map((co, i) => (
        <div key={i} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">{co.name[0]}</div>
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2">{co.name} {co.verified && <CheckCircle2 size={16} className="text-emerald-500" />}</h4>
              <p className="text-xs text-slate-500 font-medium">Hiring Success: {co.success}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xl font-black ${co.score > 90 ? 'text-emerald-600' : 'text-yellow-600'}`}>{co.score}%</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Score</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const InternshipMarketplace = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Internship Marketplace</h3>
        <p className="text-sm text-slate-500 font-medium">NGO, remote, and government green opportunities</p>
      </div>
      <div className="p-3 bg-purple-100 rounded-xl text-purple-600"><Briefcase size={24} /></div>
    </div>
    <div className="flex gap-4 border-b border-slate-200 pb-4">
      <button className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-full text-xs uppercase tracking-widest">Green Internships</button>
      <button className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-full text-xs uppercase tracking-widest hover:bg-slate-200">NGO Opportunities</button>
      <button className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-full text-xs uppercase tracking-widest hover:bg-slate-200">Govt Projects</button>
    </div>
    <div className="grid grid-cols-2 gap-6">
      {[1, 2].map((_, i) => (
        <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-bold text-slate-900">Solar Panel Installation Intern</h4>
              <p className="text-sm text-slate-500">SunPower NGO • Remote</p>
            </div>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded">Stipend</span>
          </div>
          <p className="text-sm text-slate-600 mb-6">Learn practical skills in residential solar deployment and grid integration over a 3-month period.</p>
          <button onClick={() => toast.success('Application submitted for Solar Panel Installation Intern!')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors">Apply Now</button>
        </div>
      ))}
    </div>
  </div>
);

const HiringReadiness = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Hiring Readiness Index</h3>
        <p className="text-sm text-slate-500 font-medium">Comprehensive employability scoring engine</p>
      </div>
      <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600"><Zap size={24} /></div>
    </div>
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1 bg-slate-900 p-8 rounded-3xl text-center flex flex-col justify-center">
        <h1 className="text-6xl font-black text-yellow-400 tracking-tighter">78<span className="text-2xl">%</span></h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Overall Readiness</p>
      </div>
      <div className="col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
        {[
          { l: 'Resume Quality', v: 85 },
          { l: 'Skill Strength', v: 70 },
          { l: 'Interview Readiness', v: 60 },
          { l: 'Communication', v: 95 }
        ].map((w, i) => (
          <div key={i}>
             <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
               <span>{w.l}</span><span>{w.v}%</span>
             </div>
             <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
               <div className="h-full bg-yellow-500" style={{ width: `${w.v}%` }}></div>
             </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MentorPortal = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Mentor Management</h3>
        <p className="text-sm text-slate-500 font-medium">Student assignment and session tracking</p>
      </div>
      <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Users size={24} /></div>
    </div>
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <h4 className="font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Upcoming Sessions</h4>
      <div className="space-y-4">
        {[
          { t: 'Career Guidance', s: 'Ravi Kumar', d: 'Today, 4:00 PM' },
          { t: 'Mock Interview Review', s: 'Priya Sharma', d: 'Tomorrow, 10:00 AM' }
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <h5 className="font-bold text-slate-900 text-sm">{s.t}</h5>
              <p className="text-xs text-slate-500">Student: {s.s}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-blue-600">{s.d}</p>
              <button onClick={() => toast.success('Requesting schedule change...')} className="text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-blue-600 mt-1">Reschedule</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CommunityHub = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Community Hub</h3>
        <p className="text-sm text-slate-500 font-medium">Discussion forums and peer learning</p>
      </div>
      <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><MessageSquare size={24} /></div>
    </div>
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-slate-900">Trending Discussions</h4>
        <button onClick={() => toast.success('Opening discussion editor...')} className="px-4 py-2 bg-orange-500 text-white font-bold rounded-xl text-xs hover:bg-orange-600">New Post</button>
      </div>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h5 className="font-bold text-sm text-slate-900 mb-1">How did you prepare for the Solar Installer certification?</h5>
          <p className="text-xs text-slate-500">Posted by Ankit • 24 replies</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h5 className="font-bold text-sm text-slate-900 mb-1">Success Story: Landed my first EV job in Bangalore!</h5>
          <p className="text-xs text-slate-500">Posted by Sneha • 156 likes</p>
        </div>
      </div>
    </div>
  </div>
);

const PlacementAnalytics = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Placement Analytics</h3>
        <p className="text-sm text-slate-500 font-medium">Platform-wide placement trends and statistics</p>
      </div>
      <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><TrendingUp size={24} /></div>
    </div>
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-slate-900 p-6 rounded-3xl text-white">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Highest Salary</p>
        <h1 className="text-4xl font-black tracking-tighter text-emerald-400">₹8.5<span className="text-xl">LPA</span></h1>
      </div>
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Students Placed</p>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">1,204</h1>
      </div>
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Top Recruiter</p>
        <h1 className="text-2xl font-black tracking-tighter text-slate-900 mt-2">Tata Solar</h1>
      </div>
    </div>
  </div>
);

const OfflineLearning = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Offline Learning Mode</h3>
        <p className="text-sm text-slate-500 font-medium">Download courses and auto-sync when connected</p>
      </div>
      <div className="p-3 bg-slate-200 rounded-xl text-slate-600"><DownloadCloud size={24} /></div>
    </div>
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={32} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Auto-Sync Enabled</h2>
      <p className="text-slate-500 font-medium mt-2 max-w-sm mb-8">Your downloaded courses and offline notes will automatically sync when you reconnect to the internet.</p>
      <button onClick={() => toast.success('Syncing 2.4 GB of offline course material...')} className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors">Manage Downloads (2.4 GB)</button>
    </div>
  </div>
);

const PredictiveSuccess = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AI Predictive Success</h3>
        <p className="text-sm text-slate-500 font-medium">Probability models and future skill demand</p>
      </div>
      <div className="p-3 bg-fuchsia-100 rounded-xl text-fuchsia-600"><BrainCircuit size={24} /></div>
    </div>
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-fuchsia-50 p-6 rounded-3xl border border-fuchsia-100">
        <h4 className="font-bold text-fuchsia-900 mb-2">Placement Probability</h4>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-black text-fuchsia-600 tracking-tighter">89%</span>
        </div>
        <p className="text-sm text-fuchsia-700 font-medium">Based on current course completion and quiz scores.</p>
      </div>
      <div className="bg-slate-900 p-6 rounded-3xl text-white flex flex-col justify-center">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Recommended Next Skill</p>
        <h2 className="text-2xl font-bold text-white">Advanced Battery Tech</h2>
        <p className="text-sm text-slate-400 mt-2">Demand projected to grow by 45% in 2027.</p>
      </div>
    </div>
  </div>
);

// Array of all features to render in the sidebar
const features = [
  { id: 'tools', icon: Brain, title: 'Quick Tools', component: QuickToolsModule },
  { id: 'language', icon: Globe2, title: 'Regional Support', component: RegionalLanguageSupport },
  { id: 'resume', icon: FileText, title: 'AI Resume Builder', component: AIResumeBuilder },
  { id: 'match', icon: Target, title: 'AI Resume Match', component: SmartJobMatch },
];

const Placeholder = ({ title, desc }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] bg-slate-50 rounded-[40px] border border-slate-200 text-center p-12">
    <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-900/20">
      <Sparkles className="text-white" size={32} />
    </div>
    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase  mb-4">{title}</h2>
    <p className="text-slate-500 font-medium max-w-md">{desc}</p>
    <div className="mt-8 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2">
      <CheckCircle2 size={16} /> Module Initialized
    </div>
  </div>
);

const PremiumEcosystem = () => {
  const [activeTab, setActiveTab] = useState(features[0].id);

  const ActiveComponent = features.find(f => f.id === activeTab)?.component || features[0].component;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50 pb-12">
        <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-2">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm tracking-wide ${
                  activeTab === feature.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <feature.icon size={18} className={activeTab === feature.id ? 'text-emerald-400' : 'text-slate-400'} />
                  {feature.title}
                </div>
                {activeTab === feature.id && <ChevronRight size={16} className="text-slate-400" />}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default PremiumEcosystem;
