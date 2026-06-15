import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Plus, Users, Briefcase, 
  CheckCircle, ShieldAlert, BarChart, Clock,
  Trophy, Medal, Star, Target, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/api';

import JobManagement from './JobManagement';
import ExamCreator from './ExamCreator';
import CandidateList from './CandidateList';
import ApplicationsList from './ApplicationsList';
import HiredUsers from './HiredUsers';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [topTalent, setTopTalent] = useState([]);
  const [loading, setLoading] = useState(true);

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
          const calculatedScore = quizScore || (completedCourses * 25) || 50;
          const badgeCount = s.badges?.length || s.ultraStreak?.badgeInventory?.length || 0;
          return {
            ...s,
            score: Math.min(calculatedScore, 100),
            badges: badgeCount
          };
        }).sort((a, b) => b.score - a.score);
        setTopTalent(students);
      } catch (error) {
        console.error('Leaderboard sync failed:', error);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [activeTab]);

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
          <div className="mb-12 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
              <div>
                <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter italic">
                  TALENT <span className="text-primary">LEADERBOARD</span>
                </h2>
                <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed mt-2">
                  Analyzing performance metrics across the rural nexus. Identifying top-tier green expertise.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-8 py-4 bg-slate-900 text-white rounded-[24px] shadow-2xl flex items-center gap-4">
                  <Trophy className="text-amber-400" size={32} />
                  <div>
                    <p className="text-2xl font-black italic tracking-tighter">{topTalent.length}</p>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Active Candidates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Leaderboard Table */}
            <div className="lg:col-span-2 space-y-6">
              {loading ? (
                <div className="bg-white p-20 rounded-[40px] flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                topTalent.map((talent, i) => (
                  <motion.div
                    key={talent._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic ${
                        i === 0 ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/30' :
                        i === 1 ? 'bg-slate-200 text-slate-600' :
                        i === 2 ? 'bg-orange-200 text-orange-700' :
                        'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}>
                        #{i + 1}
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center border border-slate-100 overflow-hidden">
                          {talent.profilePicture ? (
                            <img src={talent.profilePicture} className="w-full h-full object-cover" />
                          ) : (
                            <Users size={32} className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{talent.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10 italic">
                              {talent.skillsInterested?.[0] || 'Renewable Energy'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{talent.score}%</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Skill Index</p>
                      </div>
                      <div className="h-12 w-px bg-slate-100"></div>
                      <div className="flex flex-col items-center">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, j) => (
                            <Medal key={j} size={14} className={j < talent.badges ? 'text-amber-400' : 'text-slate-200'} fill={j < talent.badges ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Badges</p>
                      </div>
                      <button className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all group-hover:scale-110">
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
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
                <button className="w-full mt-10 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                  Analyze Full Nexus
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'jobs' && <JobManagement />}

      {activeTab === 'exams' && <ExamCreator />}

      {activeTab === 'candidates' && <CandidateList />}

      {activeTab === 'hired' && <HiredUsers />}

      {activeTab === 'applications' && <ApplicationsList />}
    </DashboardLayout>
  );
};

export default EmployerDashboard;
