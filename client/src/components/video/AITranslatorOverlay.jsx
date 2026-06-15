import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2, CheckCircle2, Wand2, Volume2, X, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TARGET_LANGUAGES = [
  'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 
  'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Arabic', 'French', 
  'German', 'Spanish', 'Japanese', 'Korean', 'Chinese'
];

const PROCESSING_STEPS = [
  { id: 'extract', name: 'Audio Extraction & Separation' },
  { id: 'stt', name: 'Whisper Speech Recognition' },
  { id: 'translate', name: 'Contextual Translation' },
  { id: 'tts', name: 'Neural Voice Generation' },
  { id: 'lipsync', name: 'AI Lip Sync & Rebuilding' }
];

const AITranslatorOverlay = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const startTranslation = (lang) => {
    setTargetLanguage(lang);
    setIsProcessing(true);
    setCurrentStep(0);
    setProgress(0);

    // Simulate pipeline
    let step = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      
      if (currentProgress >= 100) {
        step++;
        if (step >= PROCESSING_STEPS.length) {
          clearInterval(interval);
          setIsProcessing(false);
          setIsOpen(false);
          toast.success(`Video successfully translated to ${lang}`);
          if (onComplete) onComplete(lang);
          return;
        }
        currentProgress = 0;
        setCurrentStep(step);
      }
      setProgress(Math.min(currentProgress, 99));
    }, 200);
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-black/70 backdrop-blur-md border border-white/20 rounded-xl p-2 flex items-center gap-2 hover:bg-indigo-500/80 transition-all text-white text-xs font-bold shadow-lg"
        >
          <Wand2 size={16} className={isOpen ? 'text-white' : 'text-indigo-400'} />
          AI Dubbing
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-6"
          >
            {!isProcessing ? (
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              >
                <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">AI Translation Engine</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select target language</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 mb-6">
                  {TARGET_LANGUAGES.map(lang => (
                    <button 
                      key={lang}
                      onClick={() => startTranslation(lang)}
                      className="py-3 px-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border border-slate-700 hover:border-indigo-500 text-center"
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center gap-3">
                  <Volume2 size={16} className="text-indigo-400" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Voice cloning & lip-sync will be automatically applied to preserve original delivery.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(99,102,241,0.2)]"
              >
                <div className="text-center mb-8">
                  <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Processing Video</h3>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">Translating to {targetLanguage}</p>
                </div>

                <div className="space-y-4">
                  {PROCESSING_STEPS.map((step, idx) => {
                    const isPast = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    const isFuture = idx > currentStep;

                    return (
                      <div key={step.id} className={`flex items-center gap-3 ${isFuture ? 'opacity-30' : 'opacity-100'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isPast ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                          {isPast ? <CheckCircle2 size={12} /> : <Loader2 size={12} className={isCurrent ? 'animate-spin' : ''} />}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-indigo-400' : 'text-slate-300'}`}>{step.name}</h4>
                          {isCurrent && (
                            <div className="mt-1 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: `${progress}%` }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AITranslatorOverlay;
