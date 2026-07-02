import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, Share2, Shield, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, API_BASE_URL } from '../../utils/api';

const LeagueShield = ({ active, color, shadowColor, icon: Icon, locked }) => (
  <div className={`relative flex flex-col items-center justify-center transition-all duration-300 ${active ? 'scale-125 z-10 -translate-y-2' : 'scale-100 opacity-80 hover:opacity-100'}`}>
    <div className={`w-16 h-20 rounded-t-2xl rounded-b-3xl flex items-center justify-center bg-gradient-to-br ${color} shadow-[0_10px_20px_${shadowColor}] border-t border-white/60 relative overflow-hidden`}>
       {locked ? (
         <div className="w-5 h-6 border-2 border-white/50 rounded-t-md relative mt-2">
           <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 border-2 border-white/50 rounded-full border-b-0"></div>
         </div>
       ) : (
         <Icon className={active ? 'text-white w-8 h-8' : 'text-white/80 w-6 h-6'} />
       )}
       {/* Highlight shine */}
       <div className="absolute top-0 left-2 w-4 h-full bg-white/20 skew-x-[20deg] rounded-full"></div>
    </div>
  </div>
);

const LeaderboardPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/streak/leaderboard`);
        setData(res.data || []);
      } catch (error) {
        console.error("Fetch Leaderboard Error:", error);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const safeData = Array.isArray(data) ? data : [];

  return (
    <DashboardLayout role="student">
      {/* Top Background Gradient matching image */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-100/50 via-yellow-50/30 to-slate-50 -z-10 overflow-hidden pointer-events-none">
        {/* Sunburst effect */}
        <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[1600px] h-[1600px] bg-[conic-gradient(from_0deg_at_50%_50%,#fff_0deg,#fff0_10deg,#fff_20deg,#fff0_30deg,#fff_40deg,#fff0_50deg,#fff_60deg,#fff0_70deg,#fff_80deg,#fff0_90deg,#fff_100deg,#fff0_110deg,#fff_120deg,#fff0_130deg,#fff_140deg,#fff0_150deg,#fff_160deg,#fff0_170deg,#fff_180deg,#fff0_190deg,#fff_200deg,#fff0_210deg,#fff_220deg,#fff0_230deg,#fff_240deg,#fff0_250deg,#fff_260deg,#fff0_270deg,#fff_280deg,#fff0_290deg,#fff_300deg,#fff0_310deg,#fff_320deg,#fff0_330deg,#fff_340deg,#fff0_350deg,#fff_360deg)] opacity-[0.2]"></div>
      </div>

      <div className="max-w-[900px] mx-auto py-8 px-4 relative z-10">
        {/* Header */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-600 font-bold text-sm mb-6 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-800">Monthly Leaderboard</h1>
            <Info size={20} className="text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 rounded-full text-primary font-bold text-sm shadow-sm hover:shadow-md transition-all">
              <Share2 size={16} /> Share
            </button>
            <button className="flex items-center gap-2 px-5 py-2 bg-white border border-primary/30 rounded-full text-primary font-bold text-sm shadow-sm hover:shadow-md transition-all">
              History <span className="text-[10px] ml-1">▼</span>
            </button>
          </div>
        </div>

        {/* League Shields */}
        <div className="flex justify-center items-end gap-6 mb-10 h-28">
          <LeagueShield color="from-stone-400 to-stone-500" shadowColor="rgba(120,113,108,0.3)" icon={Shield} />
          <LeagueShield color="from-orange-400 to-orange-700" shadowColor="rgba(194,65,12,0.3)" icon={Shield} />
          <LeagueShield color="from-slate-300 to-slate-400" shadowColor="rgba(148,163,184,0.3)" icon={Shield} />
          <LeagueShield active color="from-yellow-400 to-amber-500" shadowColor="rgba(245,158,11,0.5)" icon={Trophy} />
          <LeagueShield color="from-gray-100 to-gray-200" shadowColor="rgba(226,232,240,0.3)" locked />
          <LeagueShield color="from-gray-100 to-gray-200" shadowColor="rgba(226,232,240,0.3)" locked />
        </div>

        {/* League Info */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Gold League</h2>
          <p className="text-slate-500 font-medium text-sm mb-3">
            Jun 2026 <span className="mx-2 text-slate-300">|</span> <span className="text-orange-500 font-bold">25 days left</span>
          </p>
          <p className="text-slate-500 font-medium text-sm">Top 35% advance to the next league</p>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#1a202c] text-white flex items-center px-6 py-4">
            <div className="w-16 font-bold text-sm text-slate-300">Rank</div>
            <div className="flex-1 font-bold text-sm text-slate-300 flex items-center gap-1">
              Learners <Info size={12} className="text-slate-500 cursor-pointer" />
            </div>
            <div className="w-24 text-right font-bold text-sm text-slate-300 flex items-center justify-end gap-1">
              XP <Info size={12} className="text-slate-500 cursor-pointer" />
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-medium">Loading rankings...</div>
          ) : (
            <div className="flex flex-col">
              {safeData.map((user, idx) => {
                const rank = idx + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;
                const isMe = currentUser?._id === user._id;

                let rankBg = 'bg-transparent';
                let rankText = 'text-slate-600 font-medium';
                if (isTop1) { rankBg = 'bg-[#facc15]'; rankText = 'text-white font-black'; }
                else if (isTop2) { rankBg = 'bg-[#cbd5e1]'; rankText = 'text-white font-black'; }
                else if (isTop3) { rankBg = 'bg-[#fb923c]'; rankText = 'text-white font-black'; }

                return (
                  <div key={user._id} className={`flex items-center px-6 py-4 border-b border-slate-100 transition-colors ${isTop1 ? 'bg-orange-50/50' : 'hover:bg-slate-50'} ${isMe ? 'bg-blue-50/30' : ''}`}>
                    <div className="w-16 flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${rankBg} ${rankText}`}>
                        {rank}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm ${isTop1 ? 'bg-blue-100 text-blue-600' : isTop2 ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-slate-200 text-slate-600'}`}>
                        {user.profilePicture ? (
                          <img src={user.profilePicture.startsWith('http') ? user.profilePicture : `${API_BASE_URL}${user.profilePicture}`} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="uppercase">{user.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <span className={`font-bold ${isMe ? 'text-primary' : 'text-slate-700'}`}>{user.name}</span>
                    </div>

                    <div className="w-24 text-right flex items-center justify-end gap-2">
                      <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                        XP
                      </div>
                      <span className="font-bold text-slate-700">{user.ultraStreak?.leaderboardPoints || 0}</span>
                    </div>
                  </div>
                );
              })}
              
              {safeData.length === 0 && (
                <div className="py-10 text-center text-slate-400">No data available on the leaderboard.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaderboardPage;
