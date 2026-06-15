import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame } from 'lucide-react';
import { useStreak } from '../../context/StreakContext';

export default function StreakHubFAB() {
  const { setShowHub, streakData } = useStreak();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setShowHub(true)}
      className="fixed bottom-24 right-6 md:bottom-8 md:right-24 z-[50] flex items-center justify-center p-4 bg-gradient-to-tr from-emerald-600 to-cyan-500 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.5)] border-2 border-white/20 hover:shadow-[0_0_30px_rgba(52,211,153,0.8)] transition-all group"
    >
      <div className="absolute inset-0 rounded-full bg-white/20 blur-md group-hover:bg-white/40 transition-colors"></div>
      
      <Trophy className="w-6 h-6 text-white relative z-10" />
      
      {streakData?.currentStreak > 0 && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-black">
          <Flame className="w-3 h-3 text-red-600" />
          {streakData.currentStreak}
        </div>
      )}
    </motion.button>
  );
}
