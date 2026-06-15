import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import StreakCore3D from './StreakCore3D';
import { useStreak } from '../../context/StreakContext';

export default function StreakCinematic() {
  const { showCinematic, setShowCinematic, cinematicPayload } = useStreak();

  if (!showCinematic || !cinematicPayload) return null;

  const handleClose = () => setShowCinematic(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 overflow-hidden font-sans"
      >
        {/* Massive 3D Plasma Flame Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas camera={{ position: [0, 1, 8], fov: 45 }}>
            <StreakCore3D streakLevel={cinematicPayload.streakLevel} />
            <EffectComposer disableNormalPass>
              <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={2} />
            </EffectComposer>
          </Canvas>
          <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
        </div>

        {/* Epic Minimalist Flame UI */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full p-8 pointer-events-none">
          
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="text-white/50 font-bold tracking-[0.5em] uppercase text-sm mb-4">
              NEXUS IGNITED
            </div>
            
            <h1 className="text-white font-black tracking-widest uppercase text-4xl md:text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] mb-8">
              Streak Maintained
            </h1>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.4, delay: 0.4 }}
            className="relative flex items-center justify-center my-6"
          >
            {/* The giant streak number right in front of the flame */}
            <span className="text-[12rem] md:text-[18rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-transparent drop-shadow-2xl leading-none">
              {cinematicPayload.streakLevel}
            </span>
          </motion.div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap gap-6 justify-center mt-12"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 min-w-[160px] shadow-2xl">
              <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Energy Mined</div>
              <div className="text-4xl font-black text-white">
                +{cinematicPayload.earnedXp}
              </div>
            </div>
            
            {cinematicPayload.newBadges && cinematicPayload.newBadges.map((badge, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 min-w-[160px] shadow-2xl">
                <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Node Unlocked</div>
                <div className="text-2xl font-bold text-white leading-tight">
                  {badge}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            onClick={handleClose}
            className="mt-16 px-14 py-4 bg-white text-slate-950 hover:bg-gray-200 rounded-full font-black tracking-widest uppercase text-sm transition-all pointer-events-auto hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
