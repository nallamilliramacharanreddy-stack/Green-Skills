import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ArrowLeft, BadgeCheck, FileCheck, Layers, Shield, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CertificateGenerator from '../../components/certificate/CertificateGenerator';

const Certificates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCertCourse, setSelectedCertCourse] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const completedCourses = user?.progress?.completedCourses || [];

  const getCourseProgress = (course) => {
    if (!user || !course) return 0;
    const targetId = (course._id || course).toString();
    const prog = user.progress?.courseProgress?.find(p => {
      const id = p.courseId?._id || p.courseId;
      return id && id.toString() === targetId;
    });

    if (!prog) {
      const isCompleted = user.progress?.completedCourses?.some(c => (c?._id || c).toString() === targetId);
      return isCompleted ? 100 : 0;
    }

    const totalLessons = course.lessons?.length || 0;
    const totalTasks = course.tasks?.length || 0;
    const totalItems = totalLessons + totalTasks;
    if (totalItems === 0) {
      const isCompleted = user.progress?.completedCourses?.some(c => (c?._id || c).toString() === targetId);
      return isCompleted ? 100 : 0;
    }

    // Filter unique completed items that actually exist in the current course
    const completedLessonsCount = [...new Set(prog.completedLessons || [])]
      .filter(idx => idx >= 0 && idx < totalLessons).length;
    const completedTasksCount = [...new Set(prog.completedTasks || [])]
      .filter(idx => idx >= 0 && idx < totalTasks).length;

    const completedItems = completedLessonsCount + completedTasksCount;
    const percentage = Math.round((completedItems / totalItems) * 100);
    return Math.min(percentage, 100);
  };

  const strictlyCompleted = completedCourses;

  const getBadgeStatus = (index) => {
    const earned = strictlyCompleted.length;
    if (earned > index) return 'earned';
    if (earned === index) return 'current';
    return 'locked';
  };

  const badges = [
    {
      name: 'Iron', icon: Shield, colors: 'from-slate-400 to-slate-500', shadow: 'shadow-[0_10px_30px_rgba(100,116,139,0.5)]'
    },
    { name: 'Bronze', icon: Shield, colors: 'from-amber-500 to-orange-500', shadow: 'shadow-[0_10px_30px_rgba(249,115,22,0.5)]' },
    { name: 'Silver', icon: Shield, colors: 'from-slate-300 to-slate-400', shadow: 'shadow-[0_10px_30px_rgba(148,163,184,0.5)]' },
    { name: 'Gold', icon: Trophy, colors: 'from-yellow-400 to-amber-500', shadow: 'shadow-[0_10px_30px_rgba(234,179,8,0.5)]' },
    { name: 'Diamond', icon: Shield, colors: 'from-cyan-300 to-blue-500', shadow: 'shadow-[0_10px_30px_rgba(6,182,212,0.5)]' },
  ];

  return (
    <DashboardLayout role="student">
      <div className="relative min-h-[90vh] bg-[#050505] overflow-hidden rounded-t-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.9)] -mt-8 -mx-4 sm:-mx-8 p-8 lg:p-16 border-t border-[#1f1f1f]">
        {/* Platinum Luxury Abstract Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-zinc-800/20 blur-[200px] rounded-full mix-blend-screen"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 blur-[150px] rounded-full mix-blend-screen"></div>
          {/* Subtle noise texture */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20"></div>
        </div>

        {/* Navigation & Header - Elite Minimalist Style */}
        <div className="relative flex flex-col xl:flex-row xl:items-end justify-between mb-20 gap-12 z-10 border-b border-[#1f1f1f] pb-10">
          <div className="flex-1">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-3 text-zinc-500 hover:text-zinc-300 font-medium text-[11px] uppercase tracking-[0.3em] transition-colors mb-12"
            >
              <span className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center group-hover:border-zinc-500 transition-all">
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              </span>
              Return to Portal
            </button>
            <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] font-medium text-white tracking-[-0.04em] leading-[0.9] mb-6">
              Official<br /><span className="text-zinc-500 italic font-serif">Certificates.</span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium max-w-xl tracking-[0.2em] leading-relaxed uppercase">
              Your verified enterprise credentials. Access your secured academic and professional artifacts.
            </p>
          </div>

          {/* Platinum Mastery Badges Row */}
          <div className="flex items-center gap-4 md:gap-6 p-5 bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-[#1f1f1f]">
            {badges.map((badge, idx) => {
              const status = getBadgeStatus(idx);
              const isLocked = status === 'locked';
              const isCurrent = status === 'current';
              const isEarned = status === 'earned';

              const BadgeIcon = badge.icon;

              return (
                <div key={idx} className="relative group/badge">
                  {/* Badge Tooltip */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/badge:opacity-100 transition-opacity bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-md whitespace-nowrap pointer-events-none z-20 shadow-xl">
                    {badge.name} Class
                  </div>

                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-[1rem] flex items-center justify-center relative overflow-hidden transition-all duration-700 ${isLocked
                      ? 'bg-[#050505] border border-[#1a1a1a]'
                      : 'bg-gradient-to-br ' + badge.colors.replace('cyan', 'zinc').replace('blue', 'neutral').replace('amber', 'yellow')
                      } ${isCurrent ? 'scale-110 z-10 border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : ''} ${isEarned ? 'shadow-[0_10px_20px_rgba(0,0,0,0.4)]' : ''}`}
                  >
                    {/* Metallic Shine Effect */}
                    {!isLocked && (
                      <>
                        <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
                        <div className="absolute -inset-2 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover/badge:opacity-100 transition-opacity duration-1000 translate-x-[-100%] group-hover/badge:translate-x-[100%] pointer-events-none"></div>
                      </>
                    )}

                    <BadgeIcon
                      size={isCurrent ? 26 : 20}
                      strokeWidth={isCurrent ? 1.5 : 1}
                      className={`transition-all ${isLocked ? 'text-zinc-800' : 'text-white/90 drop-shadow-md'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Elite Grid Layout */}
        <div className="relative z-10 mt-12">
          {strictlyCompleted.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {strictlyCompleted.map((course, idx) => (
                <motion.div
                  key={course._id || idx}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative h-full"
                >
                  {/* Holographic Container */}
                  <div className="relative h-full bg-white/[0.02] backdrop-blur-[40px] rounded-[2rem] p-8 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col justify-between overflow-hidden hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500">

                    {/* Ambient light inside card based on category */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500"></div>

                    <div className="relative z-10">
                      {/* Certificate Graphic Representation */}
                      <div className="w-full aspect-video bg-gradient-to-br from-white/5 to-transparent rounded-xl border border-white/10 mb-8 flex items-center justify-center overflow-hidden relative shadow-inner">
                        {/* Inner grid texture */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

                        <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 flex items-center justify-center">
                          <Layers size={180} className="text-white rotate-12" strokeWidth={0.5} />
                        </div>

                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30`}>
                          <Trophy size={28} />
                        </div>
                      </div>

                      {/* Text Content */}
                      <div className="flex gap-3 items-center mb-4">
                        <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[9px] font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                          <Shield size={10} className="text-cyan-400" /> Official Record
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium tracking-widest">VERIFIED</span>
                      </div>

                      <h3 className="text-2xl font-semibold text-white tracking-tight mb-3 leading-snug drop-shadow-md">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-6 line-clamp-2 leading-relaxed">
                        {course.description || "Certified training completion"}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="relative z-10 mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-medium text-slate-500 uppercase tracking-[0.2em] mb-1">Issue Date</span>
                        <span className="text-xs font-semibold text-white tracking-wider">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>

                      <button
                        onClick={() => generateCertificate(course)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 rounded-lg hover:bg-slate-200 transition-colors font-bold uppercase text-[9px] tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      >
                        <Download size={14} /> Render PDF
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] backdrop-blur-[40px] rounded-[2.5rem] border border-white/10 p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80')] opacity-[0.05] mix-blend-screen bg-cover bg-center"></div>

              <div className="w-24 h-24 bg-white/[0.05] rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] relative z-10">
                <FileCheck size={40} className="text-slate-500" strokeWidth={1} />
              </div>
              <h3 className="text-2xl font-semibold text-white tracking-tight mb-3 relative z-10">Matrix is Empty</h3>
              <p className="text-slate-400 max-w-md mb-8 relative z-10 leading-relaxed">
                You have not completed any neural pathways yet. Initialize your training protocols to unlock cryptographically verified certifications.
              </p>
              <button
                onClick={() => navigate('/dashboard/courses')}
                className="px-10 py-5 bg-white text-slate-950 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10"
              >
                Access Training Directory
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isCertModalOpen && selectedCertCourse && (
          <CertificateGenerator
            course={selectedCertCourse}
            isOpen={isCertModalOpen}
            onClose={() => setIsCertModalOpen(false)}
            user={user}
          />
        )}
      </AnimatePresence>
    </DashboardLayout >
  );
};

export default Certificates;
