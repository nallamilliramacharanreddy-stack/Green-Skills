import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Flame, Calendar, History } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useStreak } from '../../context/StreakContext';

const Streaks = () => {
  const { streakData } = useStreak() || {};
  
  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const streakHistory = streakData?.streakHistory || [];

  const [viewMode, setViewMode] = useState('current'); // 'current' or 'history'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Parse history into a Set of 'YYYY-MM-DD' using LOCAL time to prevent timezone shift
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

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    streakHistory.forEach(record => {
      if (record.date) {
        years.add(new Date(record.date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
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

  // Generate monthly data
  const monthlyData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // If viewMode is 'current', show only from currentMonth to Dec of currentYear
    // If viewMode is 'history', show Jan to Dec (0 to 11) for the selectedYear
    const isCurrentView = viewMode === 'current';
    const renderYear = isCurrentView ? currentYear : selectedYear;
    const startMonth = isCurrentView ? currentMonth : 0;
    
    const data = [];
    for (let m = startMonth; m <= 11; m++) {
      const boxes = [];
      const daysInMonth = new Date(renderYear, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const localDateStr = renderYear + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        boxes.push({
          dayNum: d,
          dateStr: localDateStr,
          isActive: activeDaysSet.has(localDateStr)
        });
      }
      data.push({
        monthIndex: m,
        monthName: months[m],
        boxes
      });
    }
    return data;
  }, [activeDaysSet, viewMode, selectedYear]);

  return (
    <DashboardLayout role="student">
      <div className="max-w-[1200px] mx-auto py-10 px-4">
        <div className="space-y-2 mb-12">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">Streak Analytics</h2>
          <p className="text-slate-500 font-medium text-lg">Your activity is continuously tracked. Maintain momentum to unlock rewards.</p>
        </div>

        {/* Primary Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Streak</p>
              <p className="text-4xl font-black text-slate-900">{currentStreak} <span className="text-base text-slate-400 font-bold">Days</span></p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longest Streak</p>
              <p className="text-4xl font-black text-slate-900">{longestStreak} <span className="text-base text-slate-400 font-bold">Days</span></p>
            </div>
          </motion.div>
        </div>

        {/* Contribution Graph Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-3">
              <Calendar className="text-fuchsia-500" /> Monthly Streak
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'current' ? 'history' : 'current')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  viewMode === 'history' 
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <History className="w-4 h-4" /> 
                {viewMode === 'current' ? 'View History' : 'Back to Current'}
              </button>
              
              {viewMode === 'history' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year} Year</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
            <div className="min-w-fit flex flex-col gap-6">
              {monthlyData.map((monthData, i) => (
                <div key={monthData.monthIndex} className="flex items-center gap-6">
                  {/* Month Label */}
                  <div className="w-12 text-right">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      {monthData.monthName}
                    </span>
                  </div>
                  
                  {/* 30 Boxes */}
                  <div className="flex gap-1.5 md:gap-2">
                    {monthData.boxes.map((day, dayIndex) => (
                      <div 
                        key={dayIndex}
                        title={day.dateStr}
                        className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 ${
                          day.isActive 
                            ? `${monthColors[monthData.monthIndex]} text-white` 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold opacity-50">{day.dayNum}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Streaks;
