import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, FileText,
  CheckCircle, XCircle, Search, Filter,
  Activity, AlertTriangle, Fingerprint, Lock, Zap, Server, MessageSquare, CornerDownRight, X, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRealTime } from '../../context/RealTimeContext';
import { API_URL, API_BASE_URL } from '../../utils/api';

const SupportDashboard = () => {
  const { user } = useAuth();
  const { socket } = useRealTime();
  const [companies, setCompanies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
  const responseEndRef = useRef(null);

  useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.responses]);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq, time, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playTone(523.25, ctx.currentTime, 0.15); // C5
      playTone(659.25, ctx.currentTime + 0.1, 0.3); // E5
    } catch (error) {
      console.warn("Failed to play notification sound:", error);
    }
  };

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        if (data.message && data.message.includes('New Support Ticket raised')) {
          playNotificationSound();
          toast.success(data.message, {
            icon: '🎟️',
            duration: 6000,
            style: {
              borderRadius: '16px',
              background: '#0f172a',
              color: '#fff',
              border: '1px solid #1e293b',
              padding: '16px',
              fontWeight: 'bold',
            }
          });

          axios.get(`${API_URL}/tickets/admin/all`)
            .then(res => {
              const fetchedTickets = Array.isArray(res.data?.tickets) 
                ? res.data.tickets 
                : (Array.isArray(res.data) ? res.data : []);
              setTickets(fetchedTickets);
              if (activeTicket) {
                const freshActive = fetchedTickets.find(t => t._id === activeTicket._id);
                if (freshActive) {
                  setActiveTicket(freshActive);
                }
              }
            })
            .catch(err => console.error("Error refreshing tickets on socket event:", err));
        }
      };

      socket.on('receive_message', handleNewMessage);
      return () => {
        socket.off('receive_message', handleNewMessage);
      };
    }
  }, [socket, activeTicket]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hirersRes, ticketsRes] = await Promise.all([
          axios.get(`${API_URL}/auth/hirers`),
          axios.get(`${API_URL}/tickets/admin/all`)
        ]);
        
        const fetchedCompanies = Array.isArray(hirersRes.data) 
          ? hirersRes.data 
          : [];
        setCompanies(fetchedCompanies);

        const fetchedTickets = Array.isArray(ticketsRes.data?.tickets) 
          ? ticketsRes.data.tickets 
          : (Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
        setTickets(fetchedTickets);
      } catch (err) {
        console.error("Error loading support dashboard data:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApproveCompany = async (id) => {
    try {
      await axios.patch(`${API_URL}/auth/hirers/${id}/approve`);
      setCompanies(prev => prev.map(c => 
        c._id === id 
          ? { ...c, isAdminApproved: true, companyDetails: { ...c.companyDetails, isVerified: true, verificationStatus: 'green' } } 
          : c
      ));
      toast.success("Company credentials verified & approved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve company");
    }
  };

  const handleRejectCompany = async (id) => {
    try {
      await axios.delete(`${API_URL}/auth/hirers/${id}/reject`);
      setCompanies(prev => prev.filter(c => c._id !== id));
      toast.success("Company application rejected and removed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject company");
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    setUpdatingTicketId(ticketId);
    try {
      const res = await axios.patch(`${API_URL}/tickets/${ticketId}/status`, { status });
      const updatedTicket = res.data.ticket || res.data;
      setTickets(prev => prev.map(t => t._id === ticketId ? updatedTicket : t));
      if (activeTicket?._id === ticketId) {
        setActiveTicket(updatedTicket);
      }
      toast.success(`Ticket status updated to ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleSendResponse = async () => {
    if (!replyText.trim() || !activeTicket) return;
    const uId = user?._id || user?.id;
    if (!uId) {
      toast.error("User context missing");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/tickets/${activeTicket._id}/response`, {
        responder: uId,
        message: replyText
      });
      const updatedTicket = res.data.ticket || res.data;
      setTickets(prev => prev.map(t => t._id === activeTicket._id ? updatedTicket : t));
      setActiveTicket(updatedTicket);
      setReplyText('');
      toast.success("Reply submitted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit response");
    }
  };

  // Stats calculation
  const totalTickets = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in-progress' || t.status === 'escalated').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const stats = [
    { label: 'Total Tickets', value: totalTickets.toString().padStart(2, '0'), icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Open Issues', value: openCount.toString().padStart(2, '0'), icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: 'In Progress', value: inProgressCount.toString().padStart(2, '0'), icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Resolved Tickets', value: resolvedCount.toString().padStart(2, '0'), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  // Filtering
  const filteredCompanies = companies.filter(c => {
    const name = c.companyDetails?.companyName || c.name || '';
    const reg = c.companyDetails?.registrationNumber || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || reg.toLowerCase().includes(query);
  });

  const filteredTickets = tickets.filter(t => {
    const subj = t.subject || '';
    const cat = t.category || '';
    const name = t.user?.name || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch = subj.toLowerCase().includes(query) || cat.toLowerCase().includes(query) || name.toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') {
      return t.status === 'open' || t.status === 'in-progress' || t.status === 'escalated';
    }
    if (statusFilter === 'resolved') {
      return t.status === 'resolved' || t.status === 'closed';
    }
    return true;
  });

  return (
    <DashboardLayout role="support">
      <div className="max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
              Support<br/><span className="text-primary">Center.</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Real-Time Tickets & User Telemetry</p>
          </div>
        </div>

        {/* Top Stats Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-[2.5rem] bg-slate-50 border ${stat.border} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/50 rounded-full blur-2xl group-hover:bg-white/80 transition-colors"></div>
              <div className={`w-14 h-14 ${stat.bg} rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm`}>
                <stat.icon className={`${stat.color}`} size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Matrix Panel (Full Width) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative bg-white rounded-[3rem] p-6 md:p-8 overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 w-full"
        >
          {/* Header controls inside panel */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                Tickets Matrix
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-Time Support & Decryption</p>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto overflow-x-auto">
              {['all', 'open', 'resolved'].map((filter) => (
                <button 
                  key={filter}
                  onClick={() => { 
                    setStatusFilter(filter); 
                    if (activeTicket && filter !== 'all') {
                      const isOpen = activeTicket.status === 'open' || activeTicket.status === 'in-progress' || activeTicket.status === 'escalated';
                      const isResolved = activeTicket.status === 'resolved' || activeTicket.status === 'closed';
                      if ((filter === 'open' && !isOpen) || (filter === 'resolved' && !isResolved)) {
                        setActiveTicket(null);
                      }
                    }
                  }}
                  className={`px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                    statusFilter === filter 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {filter === 'open' ? 'Active' : filter} ({
                    filter === 'all' ? tickets.length :
                    filter === 'open' ? tickets.filter(t => t.status === 'open' || t.status === 'in-progress' || t.status === 'escalated').length :
                    tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
                  })
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">Streaming telemetry...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 min-h-[500px]">
              {/* Left Pane: Ticket List (1/3 width on desktop) */}
              <div className={`lg:col-span-4 flex flex-col ${activeTicket ? 'hidden lg:flex' : 'flex'}`}>
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search Subject, Category, User..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all uppercase tracking-wider placeholder:text-slate-400" 
                  />
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                      <div 
                        key={ticket._id} 
                        onClick={() => setActiveTicket(ticket)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group ${
                          activeTicket?._id === ticket._id
                            ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                            : 'bg-slate-50/50 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {/* Indicator line on selected */}
                        {activeTicket?._id === ticket._id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            ticket.status === 'closed' ? 'bg-slate-200 text-slate-600 border-slate-300' :
                            ticket.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            ticket.status === 'escalated' ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1 leading-snug group-hover:text-amber-600 transition-colors">
                          {ticket.subject}
                        </h4>

                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2 bg-white/50 p-2 rounded-xl border border-slate-200/40 shadow-inner">
                          {ticket.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-black text-[9px]">
                              {ticket.user?.name?.[0] || 'U'}
                            </div>
                            <span className="truncate max-w-[90px] text-slate-600">{ticket.user?.name || 'Unknown'}</span>
                          </div>
                          <span className="uppercase bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[8px]">
                            {ticket.category}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs italic">
                      No tickets in roster.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Pane: Ticket Inspector & Replies (2/3 width on desktop) */}
              <div className={`lg:col-span-8 flex flex-col h-full ${activeTicket ? 'flex' : 'hidden lg:flex border-l border-slate-100 lg:pl-8'}`}>
                {!activeTicket ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4 self-center justify-self-center my-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-100 shadow-inner">
                      <MessageSquare size={28} className="text-amber-500 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">No Ticket Inspected</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-xs mt-2 leading-relaxed">
                      Select a record from the telemetry roster to view the decryption history, status configuration, and reply matrix.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between">
                    {/* Back button (mobile only) */}
                    <button 
                      onClick={() => setActiveTicket(null)}
                      className="lg:hidden self-start mb-4 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <X size={12} /> Back to Telemetry List
                    </button>

                    {/* Ticket Detail Scrollable Body */}
                    <div className="space-y-4 flex-1">
                      {/* Summary / User card */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                            Decryption Key: #{activeTicket._id.substring(activeTicket._id.length - 6).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{new Date(activeTicket.createdAt).toLocaleString()}</span>
                        </div>

                        <h3 className="text-md font-black text-slate-900 uppercase tracking-tight leading-snug">
                          {activeTicket.subject}
                        </h3>

                        {/* Problem description body */}
                        <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                          {activeTicket.description}
                        </div>

                        {/* Reporter info and status update */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-black text-xs">
                              {activeTicket.user?.name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 leading-none">{activeTicket.user?.name || 'Unknown User'}</p>
                              <p className="text-[9px] text-slate-400 font-bold mt-1">{activeTicket.user?.email || 'No email'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                            <select 
                              value={activeTicket.status} 
                              onChange={(e) => handleUpdateTicketStatus(activeTicket._id, e.target.value)}
                              disabled={updatingTicketId !== null}
                              className="px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none font-black text-[10px] uppercase shadow-sm"
                            >
                              <option value="open">Open</option>
                              <option value="in-progress">In-Progress</option>
                              <option value="escalated">Escalated</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Responses Thread */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <CornerDownRight size={12} /> Response Thread ({activeTicket.responses?.length || 0})
                        </h4>

                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {activeTicket.responses && activeTicket.responses.length > 0 ? (
                            activeTicket.responses.map((resp, idx) => {
                              const isSupportResponder = resp.responder?.role === 'support' || resp.responder?.role === 'admin';
                              return (
                                <div 
                                  key={resp._id || idx} 
                                  className={`flex ${isSupportResponder ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`flex gap-2 max-w-[85%] ${isSupportResponder ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                      isSupportResponder ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      <User size={12} />
                                    </div>
                                    <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                                      isSupportResponder 
                                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm' 
                                        : 'bg-white text-slate-800 border border-gray-100 rounded-tl-none shadow-sm'
                                    }`}>
                                      <p className="text-[8px] font-black uppercase tracking-wider mb-1 opacity-75">
                                        {resp.responder?.name || 'Agent'} ({resp.responder?.role || 'user'})
                                      </p>
                                      <p className="whitespace-pre-wrap">{resp.message}</p>
                                      <span className="block text-[7px] mt-1 text-right opacity-60">
                                        {new Date(resp.createdAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                              No responses recorded. Transmit the first reply below.
                            </div>
                          )}
                          <div ref={responseEndRef} />
                        </div>
                      </div>
                    </div>

                    {/* Reply Input Box */}
                    <div className="pt-4 border-t border-slate-100 flex gap-2 items-end mt-4">
                      <textarea 
                        placeholder="Type response packet message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendResponse();
                          }
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none resize-none h-14 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20"
                      ></textarea>
                      <button 
                        onClick={handleSendResponse}
                        disabled={!replyText.trim()}
                        className="px-4 py-3.5 bg-slate-900 hover:bg-amber-600 hover:text-white text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-40 shrink-0"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SupportDashboard;
