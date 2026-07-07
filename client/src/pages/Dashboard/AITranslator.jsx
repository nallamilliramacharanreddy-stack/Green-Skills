import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, Video, UploadCloud, Youtube, Play, CheckCircle2, 
  Settings2, Download, FileText, Subtitles, Volume2, Maximize,
  Wand2, Loader2, StopCircle, RefreshCw, Sparkles, Terminal, History, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRealTime } from '../../context/RealTimeContext';
import { API_URL } from '../../utils/api';

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
  { id: 'extract', name: 'Audio Extraction & Separation', desc: 'Isolating vocals and reducing background noise' },
  { id: 'stt', name: 'AI Speech Recognition & Diarization', desc: 'Diarizing speakers & detecting punctuation' },
  { id: 'translate', name: 'Context-Aware AI Translation', desc: 'Style-aligned natural language translation' },
  { id: 'tts', name: 'Neural Voice Generation', desc: 'Generating human-like synthesized voice tracks' },
  { id: 'lipsync', name: 'Audio Synchronization & Merging', desc: 'Rebuilding video using high-quality copy-stream codecs' }
];

const TRANSLATION_STYLES = [
  { id: 'natural', name: 'Natural (Idiomatic)' },
  { id: 'literal', name: 'Literal (Word-for-Word)' },
  { id: 'professional', name: 'Professional (Corporate)' },
  { id: 'educational', name: 'Educational (Academic)' }
];

const VOICE_STYLES = [
  { id: 'standard', name: 'Standard (Clear Voice)' },
  { id: 'professional', name: 'Professional (Presenter)' },
  { id: 'conversational', name: 'Conversational (Casual)' },
  { id: 'formal', name: 'Formal (News Anchor)' }
];

const getSpeakerColor = (speakerName) => {
  if (!speakerName) return 'hsl(220, 70%, 50%)';
  let hash = 0;
  for (let i = 0; i < speakerName.length; i++) {
    hash = speakerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 45%)`;
};

const AITranslator = () => {
  const { socket } = useRealTime();
  
  const [inputMethod, setInputMethod] = useState('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('Hindi');
  const [voiceOption, setVoiceOption] = useState('clone');
  const [translationStyle, setTranslationStyle] = useState('natural');
  const [voiceStyle, setVoiceStyle] = useState('standard');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Initializing pipeline...');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Uploading video state
  const [isUploading, setIsUploading] = useState(false);
  const [directVideoUrl, setDirectVideoUrl] = useState('');

  // Results & History
  const [results, setResults] = useState(null);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [jobLogs, setJobLogs] = useState([]);

  // Search & Filter
  const [origSearch, setOrigSearch] = useState('');
  const [transSearch, setTransSearch] = useState('');

  // Video Player States
  const [viewMode, setViewMode] = useState('translated');
  const [showSubtitles, setShowSubtitles] = useState(true);

  const fileInputRef = useRef(null);
  const consoleEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobLogs]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/videos/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryJobs(data);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error("File size exceeds 500MB limit.");
        return;
      }
      setUploadedFile(file);
      setIsUploading(true);

      const formData = new FormData();
      formData.append('video', file);

      try {
        const res = await fetch(`${API_URL}/videos/upload`, {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        if (data.directVideoUrl) {
          setDirectVideoUrl(data.directVideoUrl);
          toast.success("Video uploaded and prepared successfully.");
        } else {
          toast.error("Upload failed.");
        }
      } catch (err) {
        toast.error("Upload failed: " + err.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data) => {
      setCurrentStep(data.stepIndex);
      setProgress(data.progress);
      if (data.message) {
        setProcessingMessage(data.message);
        setJobLogs(prev => [...prev, `[PROGRESS] Stage: ${data.stepIndex} - ${data.message} (${Math.round(data.progress)}%)`]);
      }
    };

    socket.on('translation_progress', handleProgress);
    return () => {
      socket.off('translation_progress', handleProgress);
    };
  }, [socket]);

  const startTranslation = async () => {
    if (inputMethod === 'youtube' && !youtubeUrl) {
      toast.error("Please enter a valid YouTube URL.");
      return;
    }
    if (inputMethod === 'upload' && !directVideoUrl) {
      toast.error("Please upload a video file first.");
      return;
    }

    setIsProcessing(true);
    setIsComplete(false);
    setCurrentStep(0);
    setProgress(0);
    setProcessingMessage('Starting translation pipeline...');
    setJobLogs([`[SYSTEM] Starting translation pipeline at ${new Date().toLocaleTimeString()}`]);

    const videoSrcUrl = inputMethod === 'youtube' ? youtubeUrl : directVideoUrl;

    try {
      const response = await fetch(`${API_URL}/videos/translate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl: videoSrcUrl,
          targetLanguage,
          voiceOption,
          socketId: socket?.id,
          translationStyle,
          voiceStyle
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Translation pipeline failed');
      }

      const data = await response.json();
      setResults(data);
      setIsProcessing(false);
      setIsComplete(true);
      toast.success("Video translated and dubbed successfully!");
      fetchHistory();
    } catch (err) {
      toast.error(err.message);
      setJobLogs(prev => [...prev, `[ERROR] Pipeline aborted: ${err.message}`]);
      setIsProcessing(false);
    }
  };

  const loadJobFromHistory = (job) => {
    setResults({
      originalLanguage: job.originalLanguage,
      originalTranscript: job.originalTranscript,
      translatedTranscript: job.translatedTranscript,
      translatedVideoUrl: job.translatedVideoUrl,
      subtitleUrl: job.srtUrl,
      vttSubtitleUrl: job.vttUrl,
      srtContent: job.logs.join('\n') // Or dummy
    });
    setTargetLanguage(job.targetLanguage);
    setTranslationStyle(job.translationStyle);
    setVoiceStyle(job.voiceStyle);
    setJobLogs(job.logs || []);
    setIsComplete(true);
    setIsProcessing(false);
    toast.success(`Loaded translation job: ${job.videoName}`);
  };

  const handleDownload = (format) => {
    if (!results) return;
    toast.success(`Preparing ${format} download...`);
    
    let downloadUrl = '';
    let filename = '';

    if (format === 'Translated MP4') {
      downloadUrl = results.translatedVideoUrl;
      filename = `translated-${targetLanguage}.mp4`;
    } else if (format === 'SRT Subtitles') {
      const blob = new Blob([results.srtContent || ''], { type: 'text/plain;charset=utf-8' });
      downloadUrl = URL.createObjectURL(blob);
      filename = `subtitles-${targetLanguage}.srt`;
    } else if (format === 'Full Transcript') {
      const textContent = results.translatedTranscript
        .map(seg => `[${seg.speaker}] (${seg.start}s - ${seg.end}s): ${seg.text}`)
        .join('\n\n');
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      downloadUrl = URL.createObjectURL(blob);
      filename = `transcript-${targetLanguage}.txt`;
    }

    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Filters transcripts
  const filteredOriginal = results?.originalTranscript?.filter(seg => 
    seg.text.toLowerCase().includes(origSearch.toLowerCase()) || 
    seg.speaker.toLowerCase().includes(origSearch.toLowerCase())
  ) || [];

  const filteredTranslated = results?.translatedTranscript?.filter(seg => 
    seg.text.toLowerCase().includes(transSearch.toLowerCase()) || 
    seg.speaker.toLowerCase().includes(transSearch.toLowerCase())
  ) || [];

  return (
    <DashboardLayout role="student">
      <div className="max-w-[1500px] mx-auto py-8 lg:py-12 px-4 sm:px-8">
        
        {/* Header Section */}
        <div className="mb-12 border-b border-slate-200 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Languages className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase ">Neural Video Translator</h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Multi-modal AI Dubbing & Lip-Sync Pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
              <Sparkles size={12} className="animate-pulse" /> Advanced Engine 2.5
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Area: Translation Configuration / Workspace */}
          <div className="lg:col-span-8 space-y-6">
            {!isProcessing && !isComplete && (
              <div className="space-y-6">
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
                          onClick={() => !isUploading && fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="video/mp4,video/x-m4v,video/*" 
                            className="hidden" 
                          />
                          {isUploading ? (
                            <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
                          ) : (
                            <Video size={40} className="text-slate-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                          )}
                          <p className="text-sm font-bold text-slate-700">
                            {isUploading ? 'Uploading file to server...' : uploadedFile ? uploadedFile.name : 'Click to browse or drag video here'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">MP4, MOV, AVI, MKV (Max 500MB)</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Settings2 size={16} className="text-indigo-500" /> 2. AI Settings & Quality Controls
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <select 
                        value={voiceOption}
                        onChange={(e) => setVoiceOption(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                      >
                        {VOICE_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Translation Style</label>
                      <select 
                        value={translationStyle}
                        onChange={(e) => setTranslationStyle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                      >
                        {TRANSLATION_STYLES.map(style => (
                          <option key={style.id} value={style.id}>{style.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Voice Style</label>
                      <select 
                        value={voiceStyle}
                        onChange={(e) => setVoiceStyle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                      >
                        {VOICE_STYLES.map(style => (
                          <option key={style.id} value={style.id}>{style.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={startTranslation}
                    disabled={isUploading}
                    className="w-full mt-8 py-5 bg-slate-900 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-500/30 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wand2 size={18} className="group-hover:animate-spin" /> Initialize Pipeline
                  </button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-2xl">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 size={40} className="text-indigo-500 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter ">AI Pipeline Active</h2>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">{processingMessage}</p>
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

            {/* Results View */}
            {isComplete && results && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="text-emerald-500" size={32} />
                    <div>
                      <h3 className="text-lg font-black text-emerald-800 uppercase tracking-tight">Translation Successful</h3>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Video dubbed to {targetLanguage} (Style: {translationStyle})</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsComplete(false);
                      setYoutubeUrl('');
                      setUploadedFile(null);
                      setResults(null);
                    }}
                    className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-colors"
                  >
                    <RefreshCw size={14} /> Translate Another
                  </button>
                </div>

                <div className="bg-slate-900 rounded-[2rem] aspect-video relative overflow-hidden flex items-center justify-center border border-slate-800 shadow-2xl">
                  <video 
                    src={viewMode === 'original' ? (inputMethod === 'youtube' ? youtubeUrl : directVideoUrl) : results.translatedVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                  >
                    {showSubtitles && results.vttSubtitleUrl && (
                      <track 
                        src={results.vttSubtitleUrl}
                        kind="subtitles" 
                        srcLang={targetLanguage} 
                        label={targetLanguage} 
                        default 
                      />
                    )}
                  </video>
                </div>

                <div className="flex gap-2">
                  {['original', 'translated'].map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {mode} View
                    </button>
                  ))}
                  <button 
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${showSubtitles ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    Subtitles: {showSubtitles ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Transcripts Side-by-Side Area */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Transcripts comparison</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Original Language Transcript Panel */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Original ({results.originalLanguage})</h4>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={origSearch}
                            onChange={(e) => setOrigSearch(e.target.value)}
                            placeholder="Search original..." 
                            className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                        </div>
                      </div>
                      
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredOriginal.map((seg, idx) => (
                          <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                              <span style={{ color: getSpeakerColor(seg.speaker) }}>{seg.speaker}</span>
                              <span className="text-slate-400">{seg.start}s - {seg.end}s</span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium">{seg.text}</p>
                            {(seg.emotion || seg.tone) && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {seg.emotion && <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-[8px] font-bold text-rose-600 rounded-full">{seg.emotion}</span>}
                                {seg.tone && <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-[8px] font-bold text-blue-600 rounded-full">{seg.tone}</span>}
                                {seg.technicalTerms?.map((term, tIdx) => (
                                  <span key={tIdx} className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-[8px] font-bold text-purple-600 rounded-full">{term}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Translated Language Transcript Panel */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-indigo-50/10">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Translated ({targetLanguage})</h4>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={transSearch}
                            onChange={(e) => setTransSearch(e.target.value)}
                            placeholder="Search translation..." 
                            className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                        </div>
                      </div>
                      
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredTranslated.map((seg, idx) => (
                          <div key={idx} className="border-b border-indigo-50/20 pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                              <span style={{ color: getSpeakerColor(seg.speaker) }}>{seg.speaker}</span>
                              <span className="text-indigo-400">{seg.start}s - {seg.end}s</span>
                            </div>
                            <p className="text-xs text-slate-800 font-bold">{seg.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Terminal Log Console */}
            {(isProcessing || jobLogs.length > 0) && (
              <div className="bg-slate-950 border border-slate-800 rounded-[2rem] p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3 text-slate-400">
                  <Terminal size={16} className="text-emerald-500" />
                  <span className="text-xs font-mono font-bold tracking-widest uppercase">Processing Logs Console</span>
                </div>
                <div className="font-mono text-[10px] text-emerald-400/90 leading-relaxed max-h-[200px] overflow-y-auto space-y-1.5 custom-scrollbar pr-2 select-text">
                  {jobLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Right Area: Translation History Sidebar & Download Center */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Download Center */}
            {isComplete && results && (
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Download Center</h3>
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
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">SRT Subtitles</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">SRT Format</p>
                      </div>
                    </div>
                    <Download size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  </button>

                  <button onClick={() => handleDownload('Full Transcript')} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-rose-500"><FileText size={18} /></div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Full Transcript</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">TXT Document</p>
                      </div>
                    </div>
                    <Download size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Translation History */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History size={16} className="text-indigo-500" /> Translation History
              </h3>

              {historyJobs.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center py-6">No past jobs found</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {historyJobs.map((job, idx) => (
                    <div 
                      key={idx}
                      onClick={() => job.status === 'completed' && loadJobFromHistory(job)}
                      className={`p-4 border rounded-xl flex flex-col gap-2 cursor-pointer transition-all ${job.status === 'completed' ? 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/20' : 'border-red-100 bg-red-50/10 cursor-not-allowed'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-slate-950 truncate max-w-[150px]">{job.videoName}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${job.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                        <span>Target: {job.targetLanguage}</span>
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AITranslator;
