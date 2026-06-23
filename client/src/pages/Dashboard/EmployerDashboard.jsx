import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Users, Briefcase, 
  CheckCircle, ShieldAlert, BarChart, Clock,
  Trophy, Medal, Star, Target, ArrowUpRight,
  Search, Filter, Flame, X, Mail, Phone, MapPin, Award, BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, API_BASE_URL } from '../../utils/api';

import JobManagement from './JobManagement';
import ExamCreator from './ExamCreator';
import CandidateList from './CandidateList';
import ApplicationsList from './ApplicationsList';
import HiredUsers from './HiredUsers';
import ShortlistedUsers from './ShortlistedUsers';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [topTalent, setTopTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('xp'); // 'xp', 'skill', 'streak'
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showInspectModal, setShowInspectModal] = useState(false);

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'employer') setActiveTab('leaderboard');
    else setActiveTab(path);
  }, [location]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/users`);
        // Calculate dynamic real metrics from actual student fields
        const students = res.data.map(s => {
          const quizScore = s.quizScores && s.quizScores.length > 0 
            ? Math.round(s.quizScores.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / s.quizScores.length * 100)
            : 0;
          const completedCourses = s.progress?.completedCourses?.length || 0;
          const xpPoints = s.ultraStreak?.leaderboardPoints || 0;
          
          // Compute a realistic dynamic skill index
          let calculatedScore = 0;
          if (quizScore > 0) {
            calculatedScore = quizScore;
          } else {
            calculatedScore = (completedCourses * 15) + Math.min(Math.round(xpPoints / 10), 30);
          }
          
          if (calculatedScore === 0 && (completedCourses > 0 || xpPoints > 0 || s.quizScores?.length > 0)) {
            calculatedScore = 15;
          }
          
          const badgeCount = s.badges?.length || s.ultraStreak?.badgeInventory?.length || 0;
          return {
            ...s,
            score: Math.min(Math.max(calculatedScore, 0), 100),
            badges: badgeCount
          };
        });
        setTopTalent(students);
      } catch (error) {
        console.error('Leaderboard sync failed:', error);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [activeTab]);

  // Compute filtered and sorted list based on state
  const filteredTalent = topTalent
    .filter(talent => {
      const query = searchQuery.toLowerCase();
      const nameMatch = talent.name?.toLowerCase().includes(query);
      const skillMatch = talent.skillsInterested?.some(s => s.toLowerCase().includes(query));
      const eduMatch = talent.education?.toLowerCase().includes(query);
      return nameMatch || skillMatch || eduMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'xp') {
        return (b.ultraStreak?.leaderboardPoints || 0) - (a.ultraStreak?.leaderboardPoints || 0);
      }
      if (sortBy === 'skill') {
        return b.score - a.score;
      }
      if (sortBy === 'streak') {
        return (b.ultraStreak?.currentStreak || 0) - (a.ultraStreak?.currentStreak || 0);
      }
      return 0;
    });

  if (user && !user.isAdminApproved) {
    return (
      <DashboardLayout role="employer">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-yellow-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-8 border border-amber-100 shadow-xl shadow-amber-100/50 rotate-3">
            <Clock size={44} className="animate-pulse" />
          </div>
          <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic mb-6">Security Clearance <span className="text-amber-500">Pending</span></h2>
          <div className="max-w-2xl bg-slate-50 border border-slate-100 p-10 rounded-[32px] shadow-inner">
            <p className="text-xl font-medium text-slate-600 leading-relaxed">
              Your corporate identity is currently under review by our <span className="text-slate-900 font-bold">Main Administration</span>.
              <br /><br />
              Please allow up to <span className="px-3 py-1 bg-amber-500 text-white rounded-lg font-black mx-1">3 DAYS</span> for document verification and clearance.
              <br /><br />
              Once approved, your account features including job posting and candidate matching will be fully activated.
            </p>
          </div>
          <div className="mt-10 flex items-center gap-3 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
            <ShieldAlert size={14} className="text-amber-500" /> Identity Gated Verification v4.0
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employer">
      {activeTab === 'leaderboard' && (
        <>
          <div className="mb-10 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[9px] font-black tracking-[0.3em] text-emerald-600 uppercase">Live Nexus Sync Active</span>
                </div>
                <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter italic">
                  TALENT <span className="text-primary">LEADERBOARD</span>
                </h2>
                <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed mt-2">
                  Analyzing performance metrics across the rural nexus. Identifying top-tier green expertise.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-8 py-4 bg-slate-900 text-white rounded-[24px] shadow-2xl flex items-center gap-4 border border-white/5">
                  <Trophy className="text-amber-400 animate-bounce" size={32} />
                  <div>
                    <p className="text-2xl font-black italic tracking-tighter">{filteredTalent.length}</p>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Matching Talent</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Sort Panel */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm mb-8">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by name, skills, or education..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider placeholder:text-slate-400"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 overflow-x-auto py-1">
                {[
                  { id: 'xp', label: 'XP Points', icon: Trophy },
                  { id: 'skill', label: 'Skill Index', icon: Target },
                  { id: 'streak', label: 'Active Streak', icon: Flame }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSortBy(tab.id)}
                    className={`px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${
                      sortBy === tab.id 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Leaderboard Table */}
            <div className="lg:col-span-2 space-y-6">
              {loading ? (
                <div className="bg-white p-20 rounded-[40px] flex items-center justify-center border border-slate-50 shadow-sm">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                filteredTalent.map((talent, i) => (
                  <motion.div
                    key={talent._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic shrink-0 ${
                        i === 0 ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/20' :
                        i === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-md shadow-slate-400/10' :
                        i === 2 ? 'bg-gradient-to-br from-orange-200 to-amber-600 text-white shadow-md shadow-orange-600/10' :
                        'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}>
                        #{i + 1}
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                          {talent.profilePicture ? (
                            <img 
                              src={talent.profilePicture.startsWith('http') ? talent.profilePicture : `${API_BASE_URL}${talent.profilePicture}`} 
                              alt={talent.name}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg uppercase">
                              {talent.name.substring(0, 2)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{talent.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10 italic">
                              {talent.skillsInterested?.[0] || 'Renewable Energy'}
                            </span>
                            {talent.education && (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">
                                {talent.education}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 md:gap-12 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">
                          {sortBy === 'xp' ? `${talent.ultraStreak?.leaderboardPoints || 0} XP` :
                           sortBy === 'streak' ? `${talent.ultraStreak?.currentStreak || 0} Days` :
                           `${talent.score}%`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          {sortBy === 'xp' ? 'Learning XP' :
                           sortBy === 'streak' ? 'Active Streak' :
                           'Skill Index'}
                        </p>
                      </div>
                      <div className="h-12 w-px bg-slate-100 hidden sm:block"></div>
                      <div className="flex-col items-end shrink-0 hidden sm:flex">
                        {talent.ultraStreak?.badgeInventory && talent.ultraStreak.badgeInventory.length > 0 ? (
                          <div className="flex gap-1 max-w-[140px] overflow-hidden justify-end">
                            {talent.ultraStreak.badgeInventory.slice(0, 2).map((badge, j) => (
                              <span 
                                key={j}
                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                                  badge.rarity === 'COSMIC' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  badge.rarity === 'GOLD' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-slate-50 text-slate-500 border-slate-200'
                                }`}
                              >
                                {badge.badgeName.split(' ')[0]}
                              </span>
                            ))}
                            {talent.ultraStreak.badgeInventory.length > 2 && (
                              <span className="text-[8px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded shrink-0">
                                +{talent.ultraStreak.badgeInventory.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">No Badges</span>
                        )}
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 text-right">Badges</p>
                      </div>
                      <button 
                        onClick={() => { setSelectedCandidate(talent); setShowInspectModal(true); }}
                        className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all group-hover:scale-110 shadow-sm"
                      >
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}

              {!loading && filteredTalent.length === 0 && (
                <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <Trophy className="text-slate-200 w-16 h-16 mb-4" />
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Talent Found</h3>
                  <p className="text-slate-400 text-sm mt-2">Try adjusting your search query or filters.</p>
                </div>
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]"></div>
                <Target className="mb-6 text-primary" size={40} />
                <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-tight mb-4">Hiring <span className="text-primary">Intelligence</span></h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  Your recruitment efficiency has increased by 24% this month due to optimized matching.
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match Accuracy</span>
                    <span className="text-xl font-black italic text-primary">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clearance Level</span>
                    <span className="text-xl font-black italic text-primary">TIER 1</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <Star className="text-amber-400" fill="currentColor" size={24} />
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Market Trends</h3>
                </div>
                <div className="space-y-6">
                  {['Solar Grid Management', 'EV Infrastructure', 'Organic Supply Chain'].map((trend, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600">{trend}</span>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">+ {12 - i}%</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-10 py-5 bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                  Analyze Full Nexus
                </button>
              </div>
            </div>
          </div>

          {/* Inspect Candidate Drawer Modal */}
          <AnimatePresence>
            {showInspectModal && selectedCandidate && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[40px] border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col"
                >
                  {/* Modal Header Cover */}
                  <div className="h-40 relative bg-gradient-to-tr from-slate-900 to-indigo-950 p-8 flex items-end justify-between overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
                    <button 
                      onClick={() => { setShowInspectModal(false); setSelectedCandidate(null); }}
                      className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10 z-20"
                    >
                      <X size={18} />
                    </button>
                    
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-20 h-20 bg-white rounded-3xl p-1 overflow-hidden border-2 border-white shadow-xl shrink-0">
                        {selectedCandidate.profilePicture ? (
                          <img 
                            src={selectedCandidate.profilePicture.startsWith('http') ? selectedCandidate.profilePicture : `${API_BASE_URL}${selectedCandidate.profilePicture}`} 
                            alt={selectedCandidate.name} 
                            className="w-full h-full object-cover rounded-2xl" 
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl font-black uppercase rounded-2xl">
                            {selectedCandidate.name.substring(0, 2)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">{selectedCandidate.name}</h3>
                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-2">{selectedCandidate.education || 'Graduate Candidate'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-8 space-y-6 overflow-y-auto flex-1">
                    {/* General Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Contact Details</h4>
                        <div className="space-y-2.5 text-xs font-bold text-slate-600">
                          <div className="flex items-center gap-3">
                            <Mail size={14} className="text-primary" />
                            <a href={`mailto:${selectedCandidate.email}`} className="hover:underline hover:text-primary truncate">{selectedCandidate.email}</a>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone size={14} className="text-primary" />
                            <span>{selectedCandidate.mobile || 'No contact number'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin size={14} className="text-primary" />
                            <span>Language: {selectedCandidate.preferredLanguage || 'English'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Ambition &amp; Work</h4>
                        <div className="space-y-2.5 text-xs font-bold text-slate-600">
                          <p><strong>Current Work:</strong> {selectedCandidate.currentWork || 'Student / Job Seeker'}</p>
                          <p><strong>Career Goal:</strong> {selectedCandidate.careerGoal || 'Interested in solar energy systems'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Metric Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl text-center">
                        <Trophy className="mx-auto text-amber-500 mb-1.5" size={20} />
                        <p className="text-xl font-black text-slate-900 italic tracking-tighter">{selectedCandidate.ultraStreak?.leaderboardPoints || 0}</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">XP Points</p>
                      </div>
                      
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl text-center">
                        <Flame className="mx-auto text-orange-500 mb-1.5 animate-pulse" size={20} />
                        <p className="text-xl font-black text-slate-900 italic tracking-tighter">{selectedCandidate.ultraStreak?.currentStreak || 0} Days</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Current Streak</p>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl text-center">
                        <Target className="mx-auto text-primary mb-1.5" size={20} />
                        <p className="text-xl font-black text-slate-900 italic tracking-tighter">{selectedCandidate.score}%</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Skill Index</p>
                      </div>
                    </div>

                    {/* Quizzes & Badges Split */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Quizzes */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                          <BookOpen size={12} className="text-primary" /> Exams Cleared
                        </h4>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {selectedCandidate.quizScores && selectedCandidate.quizScores.length > 0 ? (
                            selectedCandidate.quizScores.map((scoreObj, idx) => (
                              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[11px] font-bold">
                                <div className="text-slate-600">Exam #{idx + 1}</div>
                                <div className="text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {Math.round((scoreObj.score / scoreObj.totalQuestions) * 100)}%
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">No exams cleared yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                          <Award size={12} className="text-primary" /> Badges Earned
                        </h4>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {selectedCandidate.ultraStreak?.badgeInventory && selectedCandidate.ultraStreak.badgeInventory.length > 0 ? (
                            selectedCandidate.ultraStreak.badgeInventory.map((b, idx) => (
                              <span 
                                key={idx} 
                                className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                  b.rarity === 'COSMIC' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  b.rarity === 'GOLD' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                🏆 {b.badgeName}
                              </span>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">No badges earned.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
                    <button
                      onClick={() => { setShowInspectModal(false); setSelectedCandidate(null); }}
                      className="flex-1 py-4 bg-white text-slate-600 hover:bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center border border-slate-200 shadow-sm"
                    >
                      Close Detail
                    </button>
                    <a
                      href={`mailto:${selectedCandidate.email}?subject=Green Skills Job Opportunity`}
                      className="flex-1 py-4 bg-slate-900 hover:bg-primary text-white text-center rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                      <Mail size={12} /> Contact Candidate
                    </a>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {activeTab === 'jobs' && <JobManagement />}

      {activeTab === 'exams' && <ExamCreator />}

      {activeTab === 'candidates' && <CandidateList />}

      {activeTab === 'shortlisted' && <ShortlistedUsers />}

      {activeTab === 'hired' && <HiredUsers />}

      {activeTab === 'applications' && <ApplicationsList />}
    </DashboardLayout>
  );
};

export default EmployerDashboard;
