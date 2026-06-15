import React, { useMemo } from 'react';
import { useStreak } from '../../context/StreakContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Crown, Activity, Info, Zap } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';

export default function LeaderboardHub() {
  const { showHub, setShowHub, leaderboard, streakData } = useStreak();

  const top3 = (leaderboard || []).slice(0, 3);
  const rest = (leaderboard || []).slice(3);

  // Reorder top 3 for Podium: [Rank 2, Rank 1, Rank 3]
  const podiumOrder = useMemo(() => {
    if (top3.length === 0) return [];
    if (top3.length === 1) return [null, top3[0], null];
    if (top3.length === 2) return [top3[1], top3[0], null];
    return [top3[1], top3[0], top3[2]];
  }, [top3]);

  if (!showHub) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-slate-950 text-white flex flex-col overflow-y-auto overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* Immersive 3D Space Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={1.5} />
          <ambientLight intensity={0.5} />
          <spotLight position={[0, 10, 0]} intensity={2} color="#06b6d4" penumbra={1} />
          <spotLight position={[-10, 0, 10]} intensity={2} color="#f59e0b" penumbra={1} />
        </Canvas>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] bg-cyan-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 md:px-12 md:py-12 flex flex-col min-h-screen">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-center mb-16">
          <button 
            onClick={() => setShowHub(false)}
            className="flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.1] border border-white/10 rounded-full transition-all group backdrop-blur-md"
          >
            <ArrowLeft size={16} className="text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Exit Matrix</span>
          </button>
          
          <div className="flex items-center gap-4">
            {/* Ecosystem Rank title removed per request */}
          </div>
          
          <button className="w-12 h-12 bg-white/[0.03] hover:bg-white/[0.1] border border-white/10 rounded-full flex items-center justify-center transition-all backdrop-blur-md group">
            <Share2 size={16} className="text-fuchsia-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* The Podium Matrix */}
        {podiumOrder.length > 0 ? (
          <div className="relative flex justify-center items-end h-[450px] mb-24 mt-10">
            {/* Ambient Base Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-cyan-500/20 blur-[100px] rounded-[100%] pointer-events-none"></div>

            <div className="flex items-end justify-center gap-4 md:gap-10 h-full w-full max-w-4xl relative z-10">
              {podiumOrder.map((user, i) => {
                if (!user) return <div key={i} className="w-[30%]"></div>;
                
                const isRank1 = i === 1;
                const isRank2 = i === 0;
                const isRank3 = i === 2;
                
                const rank = isRank1 ? 1 : isRank2 ? 2 : 3;
                
                // Heights
                const heightClass = isRank1 ? "h-[250px]" : isRank2 ? "h-[180px]" : "h-[140px]";
                
                // Colors
                const glowColor = isRank1 ? 'shadow-[0_-20px_60px_rgba(245,158,11,0.3)]' : isRank2 ? 'shadow-[0_-20px_50px_rgba(148,163,184,0.2)]' : 'shadow-[0_-20px_50px_rgba(249,115,22,0.2)]';
                const borderColor = isRank1 ? 'border-amber-400/50' : isRank2 ? 'border-slate-300/40' : 'border-orange-500/40';
                const textColor = isRank1 ? 'text-amber-400' : isRank2 ? 'text-slate-300' : 'text-orange-400';
                
                return (
                  <motion.div 
                    key={user._id || rank}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: isRank1 ? 0.2 : 0.5, type: 'spring', bounce: 0.4 }}
                    className={`flex flex-col items-center w-32 md:w-48 relative group`}
                  >
                    {/* Floating Avatar & Stats */}
                    <div className={`absolute flex flex-col items-center justify-end ${isRank1 ? 'bottom-[280px]' : isRank2 ? 'bottom-[210px]' : 'bottom-[170px]'} transition-all duration-700 group-hover:-translate-y-4`}>
                      
                      {isRank1 && (
                        <motion.div 
                          animate={{ y: [-5, 5, -5] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="mb-4"
                        >
                          <Crown size={40} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                        </motion.div>
                      )}

                      <div className="text-center mb-4 flex flex-col items-center">
                        <span className={`text-3xl font-black tracking-tighter ${textColor} drop-shadow-lg`}>{user.ultraStreak?.leaderboardPoints || 0}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">Power Level</span>
                      </div>

                      <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 ${borderColor} overflow-hidden shadow-2xl relative`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover relative z-0" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-3xl text-white relative z-0">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 w-max">
                          <div className={`px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border ${borderColor} text-[10px] font-black ${textColor}`}>
                            #{rank}
                          </div>
                        </div>
                      </div>

                      <h3 className="mt-4 text-sm md:text-base font-bold text-white tracking-wide truncate max-w-full text-center">
                        {user.name}
                      </h3>
                    </div>

                    {/* The Glass Pillar */}
                    <div className={`w-full ${heightClass} bg-gradient-to-b from-white/[0.08] to-transparent border-t-2 border-l border-r ${borderColor} rounded-t-[2rem] backdrop-blur-md relative overflow-hidden ${glowColor}`}>
                      {/* Inner Pillar Glows */}
                      <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${isRank1 ? 'from-amber-400/20' : isRank2 ? 'from-slate-400/20' : 'from-orange-500/20'} to-transparent`}></div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-gradient-to-b from-white/[0.05] to-transparent mix-blend-overlay"></div>
                      
                      {/* Vertical light streams */}
                      <motion.div 
                        animate={{ y: ['100%', '-100%'] }}
                        transition={{ duration: isRank1 ? 2 : 3, repeat: Infinity, ease: "linear" }}
                        className={`absolute left-1/2 -translate-x-1/2 w-1 h-32 ${isRank1 ? 'bg-amber-300' : 'bg-cyan-300'} blur-sm opacity-50`}
                      ></motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Ground Reflection Floor */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[120%] h-20 bg-gradient-to-b from-cyan-900/20 to-transparent blur-md transform perspective-[1000px] rotateX-60"></div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-[40vh]">
            <Activity size={40} className="text-slate-600 mb-6 animate-pulse" />
            <h3 className="text-xl font-bold text-slate-400 tracking-widest uppercase">Matrix is Empty</h3>
          </div>
        )}

        {/* Data Stream List (All Ranks) */}
        {leaderboard.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="w-full max-w-4xl mx-auto flex flex-col relative z-20 pb-20"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.4em]">Full Network Registry</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
            </div>

            <div className="flex flex-col gap-2">
              {leaderboard.map((user, idx) => {
                const rank = idx + 1;
                const isCurrentUser = user._id === streakData?._id;
                const isTop3 = rank <= 3;

                return (
                  <div 
                    key={user._id || idx}
                    className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 overflow-hidden ${isCurrentUser ? 'bg-cyan-900/30 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : isTop3 ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.05] hover:border-white/20'}`}
                  >
                    {/* Cyber scanning hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>

                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`w-10 text-center font-mono font-bold text-lg transition-colors ${isTop3 ? 'text-amber-400' : 'text-slate-500 group-hover:text-cyan-400'}`}>
                        {rank > 9 ? rank : `0${rank}`}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full overflow-hidden border ${isTop3 ? 'border-amber-400/50 opacity-100' : 'border-white/10 opacity-70'} group-hover:opacity-100 transition-opacity`}>
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">{user.name?.substring(0, 2).toUpperCase()}</div>
                          )}
                        </div>
                        <span className={`font-medium tracking-wide transition-colors ${isTop3 ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                          {user.name}
                        </span>
                        {isCurrentUser && <span className="ml-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">You</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Zap size={12} className={isTop3 ? 'text-amber-400' : 'text-fuchsia-400'} />
                        <span className={`text-xs font-bold ${isTop3 ? 'text-amber-300' : 'text-fuchsia-300'}`}>{user.ultraStreak?.currentStreak || 0} Sync</span>
                      </div>
                      <div className="w-px h-4 bg-white/10"></div>
                      <div className="text-right w-20">
                        <span className={`font-bold text-lg transition-colors drop-shadow-md ${isTop3 ? 'text-amber-400' : 'text-white group-hover:text-cyan-300'}`}>{user.ultraStreak?.leaderboardPoints || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
