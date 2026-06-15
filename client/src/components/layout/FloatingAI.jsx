import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Trash2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../../utils/api';

const AI_URL = `${API_URL}/ai`;

const FloatingAI = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchHistory();
    }
  }, [user, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${AI_URL}/chat?userId=${user._id}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    
    // Optimistic UI update
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setIsLoading(true);

    try {
      const res = await axios.post(`${AI_URL}/chat`, {
        userId: user._id,
        text: userMsg
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await axios.delete(`${AI_URL}/chat`, {
        data: { userId: user._id }
      });
      setMessages([{ text: "Hello! I am your AI Mentor. How can I guide you today?", isBot: true }]);
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const handleToggle = () => {
    if (!user) {
      toast.error('Please login to access the AI Mentor');
      navigate('/login');
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[500px] z-50"
          >
            <div className="p-4 text-white flex justify-between items-center shrink-0" style={{ background: 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)' }}>
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <h3 className="font-bold text-sm">Nexus AI Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate(role === 'student' ? '/dashboard/profile' : `/${role}/profile`);
                  }} 
                  className="text-white/80 hover:text-white transition-colors" 
                  title="View Profile"
                >
                  <User size={16} />
                </button>
                <button onClick={handleClear} className="text-white/80 hover:text-white transition-colors" title="Clear History">
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50 custom-scrollbar">
              {messages.map((msg, i) => {
                const isBot = msg.isBot;
                return (
                  <div key={i} className={`flex ${isBot ? 'justify-start' : 'justify-end'} gap-2 items-end`}>
                    {isBot && (
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm text-emerald">
                        <Bot size={16} />
                      </div>
                    )}
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                      isBot 
                        ? 'bg-white border border-gray-100 text-slate-800 rounded-tl-none shadow-sm' 
                        : 'bg-emerald text-white rounded-tr-none shadow-sm'
                    }`}>
                      {isBot ? (
                        <div className="markdown-content text-slate-800">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                    {!isBot && (
                      <div className="w-8 h-8 rounded-xl bg-emerald text-white flex items-center justify-center shrink-0 shadow-sm">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-white border border-gray-100 text-slate-500 rounded-tl-none shadow-sm flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your AI mentor..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald/20 text-slate-800 placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="p-2 bg-emerald text-white rounded-xl hover:bg-emerald/90 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="w-14 h-14 bg-darkslate text-white rounded-full flex items-center justify-center shadow-xl hover:bg-black transition-colors"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
};

export default FloatingAI;
