import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, Video, UploadCloud, Youtube, Play, CheckCircle2, 
  Settings2, Download, FileText, Subtitles, Volume2, Maximize,
  Wand2, Loader2, StopCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const TARGET_LANGUAGES = [
  'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 
  'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Arabic', 'French', 
  'German', 'Spanish', 'Japanese', 'Korean', 'Chinese'
];

const VOICE_OPTIONS = [
  { id: 'clone', name: 'Original Voice Cloning (AI)', icon: Wand2 },
  { id: 'male', name: 'Neural Premium Male', icon: Volume2 },
  { id: 'female', name: 'Neural Premium Female', icon: Volume2 }
];

const PROCESSING_STEPS = [
  { id: 'extract', name: 'Audio Extraction & Speaker Separation', desc: 'Isolating vocals and reducing background noise' },
  { id: 'stt', name: 'AI Speech Recognition', desc: 'Converting speech to text with Whisper AI' },
  { id: 'translate', name: 'Contextual Translation', desc: 'Translating preserving emotion and technical terms' },
  { id: 'tts', name: 'Neural Voice Generation', desc: 'Generating human-like speech in target language' },
  { id: 'lipsync', name: 'AI Lip Sync & Rebuilding', desc: 'Wav2Lip synchronization and FFmpeg video merging' }
];

const AITranslator = () => {
  const [inputMethod, setInputMethod] = useState('youtube'); // youtube | upload
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('Hindi');
  const [voiceOption, setVoiceOption] = useState('clone');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Video Player States
  const [viewMode, setViewMode] = useState('split'); // split | original | translated
  const [showSubtitles, setShowSubtitles] = useState(true);

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error("File size exceeds 500MB limit.");
        return;
      }
      setUploadedFile(file);
      toast.success("Video securely uploaded and validated.");
    }
  };

  const startTranslation = () => {
    if (inputMethod === 'youtube' && !youtubeUrl) {
      toast.error("Please enter a valid YouTube URL.");
      return;
    }
    if (inputMethod === 'upload' && !uploadedFile) {
      toast.error("Please upload a video file.");
      return;
    }

    setIsProcessing(true);
    setIsComplete(false);
    setCurrentStep(0);
    setProgress(0);

    // Simulate pipeline progression
    let step = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += Math.random() * 5 + 2;
      
      if (currentProgress >= 100) {
        step++;
        if (step >= PROCESSING_STEPS.length) {
          clearInterval(interval);
          setIsProcessing(false);
          setIsComplete(true);
          setProgress(100);
          toast.success("Translation pipeline completed successfully!");
          return;
        }
        currentProgress = 0;
        setCurrentStep(step);
      }
      setProgress(Math.min(currentProgress, 99));
    }, 300);
  };

  const handleDownload = (format) => {
    toast.success(`Preparing ${format} download...`);
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-8">
        
        {/* Header Section */}
        <div className="mb-12 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Languages className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Neural Video Translator</h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Multi-modal AI Dubbing & Lip-Sync Pipeline</p>
            </div>
          </div>
        </div>

        {!isProcessing && !isComplete && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Input Configuration */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">1. Video Source</h3>
                
                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => setInputMethod('youtube')}
                    className={`flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${inputMethod === 'youtube' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    <Youtube size={16} /> YouTube URL
                  </button>
                  <button 
                    onClick={() => setInputMethod('upload')}
                    className={`flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${inputMethod === 'upload' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    <UploadCloud size={16} /> Direct Upload
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {inputMethod === 'youtube' ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <input 
                        type="url" 
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="Paste YouTube Video URL here..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-medium focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                      />
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="video/mp4,video/x-m4v,video/*" 
                          className="hidden" 
                        />
                        <Video size={40} className="text-slate-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                        <p className="text-sm font-bold text-slate-700">{uploadedFile ? uploadedFile.name : 'Click to browse or drag video here'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">MP4, MOV, AVI, MKV (Max 500MB)</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: AI Settings */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 h-full flex flex-col">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Settings2 size={16} className="text-indigo-500" /> 2. AI Settings
                </h3>

                <div className="space-y-6 flex-1">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Language</label>
                    <select 
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                    >
                      {TARGET_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Voice Model</label>
                    <div className="space-y-2">
                      {VOICE_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <div 
                            key={opt.id}
                            onClick={() => setVoiceOption(opt.id)}
                            className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${voiceOption === opt.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                          >
                            <Icon size={18} className={voiceOption === opt.id ? 'text-indigo-600' : 'text-slate-400'} />
                            <span className="text-xs font-bold uppercase tracking-wider">{opt.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startTranslation}
                  className="w-full mt-8 py-5 bg-slate-900 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-500/30 flex items-center justify-center gap-2 group"
                >
                  <Wand2 size={18} className="group-hover:animate-spin" /> Initialize Pipeline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto bg-white rounded-[3rem] p-12 border border-slate-100 shadow-2xl">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 size={40} className="text-indigo-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">AI Pipeline Active</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Processing securely on distributed GPU cluster</p>
            </div>

            <div className="space-y-6">
              {PROCESSING_STEPS.map((step, idx) => {
                const isPast = idx < currentStep;
                const isCurrent = idx === currentStep;
                const isFuture = idx > currentStep;

                return (
                  <div key={step.id} className={`p-4 rounded-2xl border transition-all ${isCurrent ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPast ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {isPast ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-black uppercase tracking-wider ${isFuture ? 'text-slate-400' : 'text-slate-900'}`}>{step.name}</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isFuture ? 'text-slate-300' : 'text-slate-500'}`}>{step.desc}</p>
                      </div>
                      {isCurrent && (
                        <div className="text-xs font-black text-indigo-600">{Math.round(progress)}%</div>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="mt-4 w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Completion Result State */}
        {isComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="text-emerald-500" size={32} />
                <div>
                  <h3 className="text-lg font-black text-emerald-800 uppercase tracking-tight">Translation Successful</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Video successfully dubbed to {targetLanguage} with precise lip-sync</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsComplete(false);
                  setYoutubeUrl('');
                  setUploadedFile(null);
                }}
                className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-colors"
              >
                <RefreshCw size={14} /> Translate Another
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Player Area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 rounded-[2rem] aspect-video relative overflow-hidden flex items-center justify-center border border-slate-800 shadow-2xl">
                  {/* Mock Video Player */}
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                  
                  {showSubtitles && (
                    <div className="absolute bottom-16 left-0 w-full text-center px-8 z-20">
                      <p className="text-white text-lg md:text-2xl font-black bg-black/60 inline-block px-4 py-2 rounded-lg backdrop-blur-md">
                        {targetLanguage === 'Hindi' ? 'यह एआई द्वारा जनरेट किया गया अनुवाद है।' : 'This is an AI-generated translation.'}
                      </p>
                    </div>
                  )}

                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 pt-20 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform">
                        <Play size={18} className="ml-1" />
                      </button>
                      <div className="w-48 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowSubtitles(!showSubtitles)} className={`p-2 rounded-lg transition-colors ${showSubtitles ? 'text-white bg-white/20' : 'text-white/50 hover:text-white'}`}>
                        <Subtitles size={20} />
                      </button>
                      <button className="p-2 text-white/50 hover:text-white transition-colors"><Maximize size={20} /></button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {['original', 'translated', 'split'].map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {mode} View
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Options */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Download Assets</h3>
                <div className="space-y-3">
                  <button onClick={() => handleDownload('Translated MP4')} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-500"><Video size={18} /></div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Translated Video</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">MP4 Format • 1080p</p>
                      </div>
                    </div>
                    <Download size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  </button>

                  <button onClick={() => handleDownload('SRT Subtitles')} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-amber-500"><Subtitles size={18} /></div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Translated Subtitles</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">SRT / VTT Format</p>
                      </div>
                    </div>
                    <Download size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  </button>

                  <button onClick={() => handleDownload('PDF Transcript')} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-rose-500"><FileText size={18} /></div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Full Transcript</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">PDF / TXT Document</p>
                      </div>
                    </div>
                    <Download size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AITranslator;
