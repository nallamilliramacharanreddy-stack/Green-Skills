import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Sparkles, Trash2, Download, RotateCcw, 
  Paperclip, Mic, Image, FileText, UploadCloud, X, Volume2, Sparkle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your GreenSkill Assistant. How can I help you today with your learning or career?' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimer = useRef(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      const uId = user?._id || user?.id;
      if (!uId) return;
      try {
        const res = await axios.get(`${API_URL}/ai/chat?userId=${uId}`);
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map(m => ({
            id: m._id,
            role: m.isBot ? 'bot' : 'user',
            text: m.text
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    fetchChatHistory();
  }, [user]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() && attachedFiles.length === 0) return;
    if (sending) return;

    const uId = user?._id || user?.id;
    if (!uId) {
      toast.error("Authentication required");
      return;
    }

    let finalMessageText = textToSend;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => `[File Attachment: ${f.name}]`).join(' ');
      finalMessageText = `${fileNames} ${textToSend}`.trim();
    }

    const userMsg = { role: 'user', text: finalMessageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedFiles([]);
    setSending(true);

    try {
      const res = await axios.post(`${API_URL}/ai/chat`, {
        userId: uId,
        text: finalMessageText
      });
      
      const formatted = res.data.map(m => ({
        id: m._id,
        role: m.isBot ? 'bot' : 'user',
        text: m.text
      }));
      setMessages(formatted);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to get response from AI");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    const uId = user?._id || user?.id;
    if (!uId || !msgId) return;

    try {
      const res = await axios.delete(`${API_URL}/ai/chat/message`, {
        data: { userId: uId, messageId: msgId }
      });
      const formatted = res.data.messages.map(m => ({
        id: m._id,
        role: m.isBot ? 'bot' : 'user',
        text: m.text
      }));
      setMessages(formatted);
      toast.success("Message deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete message");
    }
  };

  const handleClearHistory = async () => {
    const uId = user?._id || user?.id;
    if (!uId) return;

    try {
      await axios.delete(`${API_URL}/ai/chat`, { data: { userId: uId } });
      setMessages([
        { role: 'bot', text: 'Hello! I am your GreenSkill Assistant. How can I help you today with your learning or career?' }
      ]);
      toast.success("Chat history cleared. You can restore it if needed!");
    } catch (err) {
      console.error("Failed to clear chat history:", err);
      toast.error("Failed to clear chat history");
    }
  };

  const handleRestoreHistory = async () => {
    const uId = user?._id || user?.id;
    if (!uId) return;

    try {
      const res = await axios.post(`${API_URL}/ai/chat/restore`, { userId: uId });
      const formatted = res.data.messages.map(m => ({
        id: m._id,
        role: m.isBot ? 'bot' : 'user',
        text: m.text
      }));
      setMessages(formatted);
      toast.success("Chat history restored successfully!");
    } catch (err) {
      console.error(err);
      toast.error("No cleared history available to restore");
    }
  };

  const handleExportHistory = () => {
    const uId = user?._id || user?.id;
    if (!uId) return;
    window.open(`${API_URL}/ai/chat/export?userId=${uId}`);
    toast.success("Chat history exported as Markdown!");
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (filesList) => {
    const newFiles = Array.from(filesList);
    setAttachedFiles(prev => [...prev, ...newFiles]);
    toast.success(`Attached ${newFiles.length} file(s)`);
  };

  const removeAttachedFile = (idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Voice message simulation
  const startRecording = () => {
    setIsRecording(true);
    toast.success("Recording voice message... Speak now");
  };

  const stopRecordingAndSend = () => {
    setIsRecording(false);
    const text = `[Voice message transcript: Please explain the key concepts of Sustainability and the Circular Economy]`;
    handleSend(text);
  };

  return (
    <DashboardLayout role="student">
      <div 
        className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-slate-950 border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative m-4"
        onDragEnter={handleDrag}
      >
        
        {/* Holographic glowing orbs */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
        </div>

        {/* Drag Over Overlay */}
        {dragActive && (
          <div 
            className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-emerald-500 m-4 rounded-[2rem]"
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <UploadCloud size={64} className="text-emerald-400 animate-bounce" />
            <h2 className="text-2xl font-black text-white mt-4 uppercase tracking-wider">Drag & Drop Files Here</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Supports PDF, JPG, PNG and Word Documents</p>
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 p-6 bg-white/[0.02] border-b border-white/10 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center p-[1px] shadow-[0_0_20px_rgba(52,211,153,0.2)]">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Bot size={22} className="text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Nexus AI Mentor <Sparkle size={14} className="text-emerald-400 animate-pulse" />
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Cognitive Sync
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRestoreHistory}
              className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl border border-white/10 text-white transition-all"
              title="Restore Recently Cleared Chat"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              onClick={handleExportHistory}
              className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl border border-white/10 text-white transition-all"
              title="Export History (Markdown)"
            >
              <Download size={16} />
            </button>
            <button 
              onClick={handleClearHistory}
              className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 active:scale-95 rounded-xl border border-white/10 text-white transition-all"
              title="Clear Chat History"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.map((msg, i) => {
            const isBot = msg.role === 'bot' || msg.isBot;
            return (
              <motion.div 
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${!isBot ? 'justify-end' : 'justify-start'} group relative`}
              >
                <div className={`flex gap-3 max-w-[80%] ${!isBot ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${
                    !isBot ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white'
                  }`}>
                    {!isBot ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  
                  <div className="relative">
                    <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                      !isBot 
                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(16,185,129,0.2)]' 
                        : 'bg-white/[0.03] text-slate-100 border border-white/10 rounded-tl-none shadow-xl backdrop-blur-md'
                    }`}>
                      {isBot ? (
                        <div className="markdown-content">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>

                    {/* Individual Message Delete Button (visible on hover) */}
                    {msg.id && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className={`absolute -top-2 ${!isBot ? '-left-8' : '-right-8'} p-1.5 bg-slate-900 border border-white/10 rounded-lg text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity`}
                        title="Delete Message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {sending && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white shrink-0">
                  <Bot size={18} />
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-400 rounded-tl-none flex items-center gap-2 shadow-xl backdrop-blur-md">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Attached Files Strip */}
        {attachedFiles.length > 0 && (
          <div className="relative z-10 px-8 py-3 bg-white/[0.02] border-t border-white/5 flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-white">
                {file.type.includes('image') ? <Image size={14} className="text-emerald-400" /> : <FileText size={14} className="text-cyan-400" />}
                <span className="max-w-[150px] truncate font-semibold">{file.name}</span>
                <button onClick={() => removeAttachedFile(idx)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="relative z-10 p-6 bg-white/[0.01] border-t border-white/10 backdrop-blur-md">
          {isRecording ? (
            <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
                <span className="text-rose-400 text-xs font-black uppercase tracking-widest">Recording: {recordingSeconds}s</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsRecording(false)} 
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={stopRecordingAndSend}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors"
                >
                  Stop & Send Voice
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={handleFileSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-2xl text-slate-300 hover:text-white transition-all"
                title="Attach Document/Photo"
              >
                <Paperclip size={20} />
              </button>
              
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder={sending ? "Synchronizing core..." : "Ask your AI Mentor (Supports Markdown and Files)..."}
                  disabled={sending}
                  className="w-full pl-6 pr-12 py-4 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-emerald-500/50 text-white outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium placeholder:text-slate-500 disabled:opacity-50"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={sending}
                  className="absolute right-2 top-2 p-2 bg-emerald-500 text-slate-950 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={18} />
                </button>
              </div>

              <button 
                onClick={startRecording}
                className="p-4 bg-white/5 hover:bg-rose-500/10 active:scale-95 border border-white/10 rounded-2xl text-slate-300 hover:text-rose-400 transition-all"
                title="Voice Interface"
              >
                <Mic size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIChat;
