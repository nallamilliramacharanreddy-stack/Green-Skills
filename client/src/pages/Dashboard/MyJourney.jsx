import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  CheckCircle, ArrowRight, 
  Award, BookOpen, Clock, Star, PlayCircle, Flame, Calendar, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useStreak } from '../../context/StreakContext';
import CertificateGenerator from '../../components/certificate/CertificateGenerator';
import axios from 'axios';
import { API_URL, API_BASE_URL } from '../../utils/api';

const MyJourney = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { streakData } = useStreak() || {};
  const currentStreak = streakData?.currentStreak || 0;
  const streakHistory = streakData?.streakHistory || [];

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedCertCourse, setSelectedCertCourse] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);

  const fetchCertificates = async () => {
    const uId = user?._id || user?.id;
    if (!uId) return;
    setIsLoadingCerts(true);
    try {
      const res = await axios.get(`${API_URL}/certificates?userId=${uId}`);
      setCertificates(res.data);
    } catch (err) {
      console.error("Error loading certificates:", err);
    } finally {
      setIsLoadingCerts(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [user]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const activeDaysSet = useMemo(() => {
    const set = new Set();
    streakHistory.forEach(record => {
      if (record.date) {
        const d = new Date(record.date);
        const localDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        set.add(localDateStr);
      }
    });
    return set;
  }, [streakHistory]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthColors = {
    0: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
    1: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    2: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
    3: 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]',
    4: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    5: 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]',
    6: 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]',
    7: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    8: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    9: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]',
    10: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    11: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
  };

  const calendarData = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad with empty spaces for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    // Add days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const localDateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      days.push({
        dayNum: d,
        dateStr: localDateStr,
        isActive: activeDaysSet.has(localDateStr),
        isToday: localDateStr === todayStr,
        monthIndex: month
      });
    }
    return days;
  }, [activeDaysSet, currentMonthDate]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

  const currentCourses = user?.progress?.currentCourses || [];
  const completedCourses = user?.progress?.completedCourses || [];
  
  // Merge both for a "Permanent Enrollment" view
  const allEnrolled = [...currentCourses];
  completedCourses.forEach(c => {
    if (!allEnrolled.find(ec => (ec._id || ec) === (c._id || c))) {
      allEnrolled.push(c);
    }
  });

  // Use completed courses directly without strict filtering to prevent bugs with unpopulated arrays
  const strictlyCompleted = completedCourses;

  return (
    <DashboardLayout role="student">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">My Learning Journey</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Synchronizing your path to green-tech mastery</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Left Column */}
        <div className="space-y-12">
          {/* Active Nodes */}
          <section className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <PlayCircle size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Active Nodes ({allEnrolled.length})</h3>
          </div>

          <div className="space-y-6">
            {allEnrolled.length > 0 ? allEnrolled.map((course, i) => (
              <motion.div 
                key={course._id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-primary/30 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">{course.category || 'Green Tech'}</span>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none mt-1">{course.title}</h4>
                  </div>
                  <div className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest ${getCourseProgress(course) >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                    {getCourseProgress(course) >= 100 ? 'Completed' : 'In Progress'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sync Status</span>
                    <span className="text-xs font-black text-slate-900 italic">{getCourseProgress(course)}% Synced</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${getCourseProgress(course)}%` }}></div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/dashboard/courses', { state: { openCourse: course._id } })}
                  className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 group-hover:bg-primary transition-all"
                >
                  Resume Learning <ArrowRight size={14} />
                </button>
              </motion.div>
            )) : (
              <div className="p-12 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                <BookOpen size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No active course nodes detected</p>
              </div>
            )}
          </div>
        </section>

        </div>

        {/* Right Column */}
        <div className="space-y-12">
        {/* Completed Nodes */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
              <Award size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Completed Nodes ({strictlyCompleted.length})</h3>
          </div>

          <div className="space-y-6">
            {strictlyCompleted.length > 0 ? strictlyCompleted.map((course, i) => (
              <motion.div 
                key={course._id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-emerald-50/50 p-8 rounded-[40px] border border-emerald-100 shadow-xl shadow-emerald-200/20 relative overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Specialization Achieved</span>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none mt-1">{course.title}</h4>
                  </div>
                  <div 
                    style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle size={24} />
                  </div>
                </div>
                
                <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">100% Synced</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedCertCourse(course);
                      setIsCertModalOpen(true);
                    }}
                    style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                    className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Award size={14} /> Generate Certificate
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="p-12 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                <Award size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Graduate your first node to see it here</p>
              </div>
            )}
          </div>
        </section>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Streak Minimal Graph Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-[400px] bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                <Calendar className="text-fuchsia-500" size={20} /> Streak
              </h3>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <button onClick={handlePrevMonth} className="hover:text-slate-900 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest min-w-[60px] text-center">
                {months[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
              </span>
              <button onClick={handleNextMonth} className="hover:text-slate-900 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day, i) => (
              <div key={i} className="text-center text-slate-400 font-black text-[10px] tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {calendarData.map((day, i) => (
              <div key={i} className="flex flex-col items-center justify-center h-10 relative">
                {day ? (
                  <div 
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition-all ${
                      day.isActive 
                        ? `${monthColors[day.monthIndex]} text-white` 
                        : day.isToday 
                          ? 'bg-slate-800 text-white shadow-lg' 
                          : 'text-slate-400 hover:bg-slate-100 bg-slate-50'
                    }`}
                  >
                    {day.dayNum}
                  </div>
                ) : (
                  <div className="w-8 h-8"></div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Downloaded Certificates Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full lg:flex-1 max-w-[700px] bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                <Download className="text-indigo-500" size={20} /> Downloaded Certificates
              </h3>
            </div>
            <button onClick={() => navigate('/dashboard/certificates')} className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">
              View All
            </button>
          </div>
          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.slice(0, 4).map((cert, idx) => {
                // Dynamic verification check during rendering:
                const expectedName = "NALLAMILLI RAMA CHARAN REDDY";
                if (user?.name?.trim().toUpperCase() === expectedName) {
                  if (cert.candidateName !== expectedName) {
                    throw new Error(`Certificate data mismatch: Candidate name ${cert.candidateName} does not match expected name ${expectedName}`);
                  }
                } else if (cert.candidateName !== user?.name) {
                  throw new Error(`Certificate data mismatch: Candidate name ${cert.candidateName} does not match user name ${user?.name}`);
                }
                
                return (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center text-indigo-500 border border-slate-100 group-hover:border-indigo-500 transition-colors">
                        {cert.thumbnailUrl ? (
                          <img src={`${API_BASE_URL}${cert.thumbnailUrl}`} alt="Thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <Award size={20} />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ID: {cert.certificateId}</p>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[120px]">{cert.courseName}</h4>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${API_BASE_URL}${cert.pdfUrl}`;
                        link.download = `${cert.candidateName.replace(/\s+/g, '_')}_Certificate.pdf`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors shadow-sm"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Download size={32} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No downloaded certificates found</p>
            </div>
          )}
        </motion.div>
      </div>

      <CertificateGenerator 
        course={selectedCertCourse} 
        isOpen={isCertModalOpen} 
        onClose={() => setIsCertModalOpen(false)} 
        user={user}
        onGenerated={fetchCertificates}
      />
    </DashboardLayout>
  );
};

export default MyJourney;
