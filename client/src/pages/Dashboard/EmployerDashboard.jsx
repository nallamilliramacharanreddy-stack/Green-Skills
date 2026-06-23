import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Users, Briefcase, 
  CheckCircle, ShieldAlert, BarChart, Clock,
  Trophy, Medal, Star, Target, ArrowUpRight,
  Search, Filter, Flame, X, Mail, Phone, MapPin, Award, BookOpen,
  Sparkles, Cpu, TrendingUp, Zap, Activity, Crown
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

  // Dynamic calculations for Leaderboard console
  const poolSize = topTalent.length;
  const peakSkill = topTalent.length > 0 ? Math.max(...topTalent.map(t => t.score || 0), 0) : 0;
  const avgCompetency = topTalent.length > 0 ? Math.round(topTalent.reduce((acc, t) => acc + (t.score || 0), 0) / topTalent.length) : 0;
  const totalBadges = topTalent.reduce((acc, t) => acc + (t.badges || 0), 0);

  const top3 = filteredTalent.slice(0, 3);
  const restTalent = filteredTalent.slice(3);

  // Reorder top 3 for Podium: [Rank 2, Rank 1, Rank 3]
  const podiumOrder = React.useMemo(() => {
    if (top3.length === 0) return [];
    if (top3.length === 1) return [null, top3[0], null];
    if (top3.length === 2) return [top3[1], top3[0], null];
    return [top3[1], top3[0], top3[2]];
  }, [top3]);

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
          <div className="mb-8 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black tracking-[0.4em] text-emerald-600 uppercase">Live Ecosystem Nexus Active</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                  Talent <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Console</span>
                </h2>
                <p className="text-slate-500 text-sm md:text-base font-semibold max-w-2xl leading-relaxed mt-3">
                  Dynamic visual mapping of top-tier green energy talent. Filter, rank, and inspect high-impact candidate profiles in real-time.
                </p>
              </div>
            </div>

            {/* Search & Sort Panel */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-[28px] border border-slate-100 shadow-lg mb-8">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search candidate by name, key skills, or education..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider placeholder:text-slate-400"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 overflow-x-auto py-1">
                {[
                  { id: 'xp', label: 'XP Points', icon: Trophy, color: 'text-amber-500' },
                  { id: 'skill', label: 'Skill Index', icon: Target, color: 'text-emerald-500' },
                  { id: 'streak', label: 'Active Streak', icon: Flame, color: 'text-orange-500' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSortBy(tab.id)}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${
                      sortBy === tab.id 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30 scale-105' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <tab.icon size={12} className={sortBy === tab.id ? 'text-white' : tab.color} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Podium Showcase */}
          {podiumOrder.length > 0 && !loading && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Crown size={22} className="text-amber-400 animate-pulse" />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider italic">Ecosystem Leaders</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto px-4 py-8 bg-slate-50/50 rounded-[40px] border border-slate-100 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/10 via-transparent to-yellow-100/10 pointer-events-none"></div>
                {podiumOrder.map((talent, index) => {
                  if (!talent) return <div key={index} className="hidden md:block"></div>;
                  
                  const isRank1 = index === 1 || (podiumOrder.length < 3 && talent._id === top3[0]?._id);
                  const isRank2 = index === 0 && talent._id === top3[1]?._id;
                  const isRank3 = index === 2 && talent._id === top3[2]?._id;
                  
                  const rank = isRank1 ? 1 : isRank2 ? 2 : 3;
                  
                  // Styles depending on rank
                  const cardBg = isRank1 
                    ? 'bg-white border-yellow-300 shadow-[0_15px_40px_rgba(234,179,8,0.15)] ring-2 ring-yellow-400/20' 
                    : isRank2 
                      ? 'bg-white/90 border-slate-200 shadow-xl' 
                      : 'bg-white/80 border-slate-200 shadow-lg';
                      
                  const headerGlow = isRank1 
                    ? 'from-amber-400 to-yellow-500 text-white' 
                    : isRank2 
                      ? 'from-slate-300 to-slate-400 text-slate-800' 
                      : 'from-orange-300 to-amber-600 text-white';

                  const badgeBorder = isRank1 
                    ? 'border-yellow-400' 
                    : isRank2 
                      ? 'border-slate-300' 
                      : 'border-orange-400';

                  return (
                    <motion.div
                      key={talent._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: rank * 0.1, type: 'spring', stiffness: 80 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className={`relative flex flex-col items-center p-6 rounded-[32px] border ${cardBg} transition-all duration-300 ${isRank1 ? 'md:py-10 md:-translate-y-4 z-10' : 'md:py-8 z-0'}`}
                    >
                      {/* Floating crown/trophy indicator */}
                      {isRank1 && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 drop-shadow-lg z-20">
                          <motion.div
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <Crown className="w-10 h-10 text-yellow-400 drop-shadow-[0_4px_10px_rgba(234,179,8,0.4)]" fill="currentColor" />
                          </motion.div>
                        </div>
                      )}

                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm uppercase tracking-wider absolute -top-5 left-6 shadow-md bg-gradient-to-r ${headerGlow}`}>
                        #{rank}
                      </div>

                      {/* Floating Trophy on Top-Right */}
                      <div className="absolute top-4 right-4">
                        {isRank1 ? (
                          <Trophy className="w-6 h-6 text-yellow-400" />
                        ) : (
                          <Medal className={`w-5 h-5 ${isRank2 ? 'text-slate-400' : 'text-orange-500'}`} />
                        )}
                      </div>

                      {/* Avatar */}
                      <div className={`w-24 h-24 rounded-full p-1.5 border-4 ${badgeBorder} shadow-inner overflow-hidden mb-4 shrink-0 relative bg-slate-50`}>
                        {talent.profilePicture ? (
                          <img 
                            src={talent.profilePicture.startsWith('http') ? talent.profilePicture : `${API_BASE_URL}${talent.profilePicture}`} 
                            alt={talent.name}
                            className="w-full h-full object-cover rounded-full" 
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl rounded-full uppercase">
                            {talent.name.substring(0, 2)}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow" title="Online">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        </span>
                      </div>

                      {/* Name & Title */}
                      <div className="text-center w-full">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight italic leading-tight truncate px-2">{talent.name}</h4>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                          <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 uppercase tracking-widest italic">
                            {talent.skillsInterested?.[0] || 'Renewable Energy'}
                          </span>
                          {talent.education && (
                            <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest truncate max-w-[120px]">
                              {talent.education}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* High-tech divider */}
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-5"></div>

                      {/* Main Stat display */}
                      <div className="text-center mb-5">
                        <p className="text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent italic tracking-tighter leading-none">
                          {sortBy === 'xp' ? `${talent.ultraStreak?.leaderboardPoints || 0}` :
                           sortBy === 'streak' ? `${talent.ultraStreak?.currentStreak || 0}` :
                           `${talent.score}%`}
                        </p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          {sortBy === 'xp' ? 'Learning XP' :
                           sortBy === 'streak' ? 'Streak Days' :
                           'Skill Index'}
                        </p>
                      </div>

                      {/* Detailed Stats Panel */}
                      <div className="grid grid-cols-2 gap-2 w-full mb-6">
                        <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                          <p className="text-xs font-black text-slate-800 leading-none">
                            {talent.ultraStreak?.leaderboardPoints || 0}
                          </p>
                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total XP</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                          <p className="text-xs font-black text-slate-800 leading-none">
                            {talent.badges || 0}
                          </p>
                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-1">Badges</p>
                        </div>
                      </div>

                      {/* Action Inspect Button */}
                      <button 
                        onClick={() => { setSelectedCandidate(talent); setShowInspectModal(true); }}
                        className={`w-full py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          isRank1 
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-yellow-500/20' 
                            : 'bg-slate-900 hover:bg-primary text-white shadow-slate-900/10'
                        }`}
                      >
                        Inspect Candidate <ArrowUpRight size={12} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ecosystem Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Talent Volume', value: poolSize, sub: 'Matching candidates', icon: Users, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
              { label: 'Peak Skill Index', value: `${peakSkill}%`, sub: 'Highest user score', icon: Target, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
              { label: 'Avg Competency', value: `${avgCompetency}%`, sub: 'Ecosystem standard', icon: Award, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
              { label: 'Network Accolades', value: totalBadges, sub: 'Certifications unlocked', icon: Sparkles, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-md p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${stat.color} shrink-0`}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800 tracking-tight italic">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-[8px] text-slate-400 font-medium">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Remaining Talent Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider italic">Network Candidates</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{restTalent.length} Profiles</span>
              </div>

              {loading ? (
                <div className="bg-white p-20 rounded-[40px] flex items-center justify-center border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {restTalent.map((talent, i) => {
                    const rank = i + 4; // Ranks start from 4 for rest
                    
                    // Circular progress bar calculations for skill index
                    const radius = 24;
                    const stroke = 3;
                    const normalizedRadius = radius - stroke * 2;
                    const circumference = normalizedRadius * 2 * Math.PI;
                    const strokeDashoffset = circumference - ((talent.score || 0) / 100) * circumference;

                    return (
                      <motion.div
                        key={talent._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="group bg-white p-6 rounded-[28px] border border-slate-100 hover:border-primary/20 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                      >
                        {/* Upper Details */}
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <span className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs italic">
                              #{rank}
                            </span>
                            
                            {/* Radial Skill Index Progress Bar */}
                            <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                              <svg className="w-full h-full -rotate-90">
                                <circle
                                  className="text-slate-100"
                                  strokeWidth={stroke}
                                  stroke="currentColor"
                                  fill="transparent"
                                  r={normalizedRadius}
                                  cx={radius}
                                  cy={radius}
                                />
                                <circle
                                  className="text-emerald-500 transition-all duration-500"
                                  strokeWidth={stroke}
                                  strokeDasharray={circumference + ' ' + circumference}
                                  style={{ strokeDashoffset }}
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r={normalizedRadius}
                                  cx={radius}
                                  cy={radius}
                                />
                              </svg>
                              <span className="absolute text-[8px] font-black text-slate-800">{talent.score}%</span>
                            </div>
                          </div>

                          <div className="flex gap-4 items-center mb-4">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                              {talent.profilePicture ? (
                                <img 
                                  src={talent.profilePicture.startsWith('http') ? talent.profilePicture : `${API_BASE_URL}${talent.profilePicture}`} 
                                  alt={talent.name}
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm uppercase">
                                  {talent.name.substring(0, 2)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic truncate leading-none">{talent.name}</h4>
                              <div className="flex flex-col gap-1 mt-1">
                                <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10 italic w-fit">
                                  {talent.skillsInterested?.[0] || 'Renewable Energy'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mid Details / Metrics */}
                        <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4 grid grid-cols-2 gap-2 text-center">
                          <div>
                            <p className="text-xs font-black text-slate-800 tracking-tighter">
                              {sortBy === 'xp' ? `${talent.ultraStreak?.leaderboardPoints || 0} XP` :
                               sortBy === 'streak' ? `${talent.ultraStreak?.currentStreak || 0} Days` :
                               `${talent.score}%`}
                            </p>
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {sortBy === 'xp' ? 'Learning XP' :
                               sortBy === 'streak' ? 'Active Streak' :
                               'Skill Index'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 tracking-tighter">
                              {talent.badges || 0}
                            </p>
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Badges Earned</p>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          {talent.education ? (
                            <span className="text-[8px] font-semibold text-slate-400 truncate max-w-[110px] uppercase tracking-wider bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                              {talent.education}
                            </span>
                          ) : (
                            <span className="text-[8px] font-semibold text-slate-300">Grad Candidate</span>
                          )}
                          <button 
                            onClick={() => { setSelectedCandidate(talent); setShowInspectModal(true); }}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:bg-primary hover:text-white transition-all text-[8px] font-black uppercase tracking-wider flex items-center gap-1 group-hover:scale-105"
                          >
                            Inspect <ArrowUpRight size={10} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!loading && restTalent.length === 0 && top3.length === 0 && (
                <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <Trophy className="text-slate-200 w-16 h-16 mb-4" />
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Talent Found</h3>
                  <p className="text-slate-400 text-sm mt-2">Try adjusting your search query or filters.</p>
                </div>
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              {/* Sci-Fi Hiring Intelligence */}
              <div className="bg-slate-950 p-8 rounded-[40px] shadow-2xl text-slate-100 border border-slate-800 relative overflow-hidden group">
                {/* Glowing Sci-Fi Grid lines background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#022c22_1px,transparent_1px),linear-gradient(to_bottom,#022c22_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="w-10 h-10 bg-emerald-950 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <Cpu size={20} className="animate-spin-slow" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">System Diagnostics</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-tight mb-3 relative z-10">
                  Hiring <span className="text-emerald-400">Intelligence</span>
                </h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6 relative z-10">
                  Real-time cognitive matching algorithms have optimized your recruitment flow. 
                </p>

                {/* Diagnostics Gauges */}
                <div className="space-y-4 relative z-10">
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-emerald-500/20 transition-all flex justify-between items-center">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Matching Fidelity</span>
                      <p className="text-sm font-bold text-slate-300 mt-0.5">Algorithm Accuracy</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black italic text-emerald-400">94.2%</span>
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Optimum Range</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-emerald-500/20 transition-all flex justify-between items-center">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Security Index</span>
                      <p className="text-sm font-bold text-slate-300 mt-0.5">Clearance Level</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black italic text-emerald-400">Tier 1</span>
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Full Clearance</p>
                    </div>
                  </div>
                </div>

                {/* Pulsing Scan bar */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent my-6 relative z-10"></div>

                {/* System Stats progress meters */}
                <div className="space-y-3 relative z-10">
                  <div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      <span>Network Velocity</span>
                      <span className="text-emerald-400">+8.5%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      <span>Rural Engagement</span>
                      <span className="text-emerald-400">+12.4%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '74%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Trends Panel */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-md">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-amber-500" size={20} />
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Market Trends</h3>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">Real-Time</span>
                </div>
                <div className="space-y-5">
                  {[
                    { trend: 'Solar Grid Management', val: 12, col: 'bg-emerald-500' },
                    { trend: 'EV Infrastructure', val: 11, col: 'bg-emerald-500' },
                    { trend: 'Organic Supply Chain', val: 9, col: 'bg-emerald-500' }
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-all flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{item.trend}</span>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">High Demand Skill</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">+ {item.val}%</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
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
