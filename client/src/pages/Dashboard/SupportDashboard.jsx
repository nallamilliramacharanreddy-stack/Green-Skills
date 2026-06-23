import React, { useState, useEffect } from 'react';
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
import { API_URL, API_BASE_URL } from '../../utils/api';

const SupportDashboard = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('tickets'); // 'clearance' or 'tickets'
  const [companies, setCompanies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hirersRes, ticketsRes] = await Promise.all([
          axios.get(`${API_URL}/auth/hirers`),
          axios.get(`${API_URL}/tickets/admin/all`)
        ]);
        setCompanies(hirersRes.data || []);
        // Backend returns `{ success: true, tickets: [...] }` or just array
        const fetchedTickets = ticketsRes.data?.tickets || ticketsRes.data || [];
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
  const pendingAuth = companies.filter(c => !c.isAdminApproved).length;
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const resolutionPercentage = tickets.length > 0 
    ? Math.round((resolvedTicketsCount / tickets.length) * 100)
    : 100;

  const stats = [
    { label: 'Pending Auth', value: pendingAuth.toString().padStart(2, '0'), icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Active Threats', value: '00', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: 'Open Tickets', value: openTicketsCount.toString().padStart(2, '0'), icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'System Health', value: '100%', icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
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
    const query = searchQuery.toLowerCase();
    return subj.toLowerCase().includes(query) || cat.toLowerCase().includes(query);
  });

  return (
    <DashboardLayout role="support">
      <div className="max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
              Overwatch<br/><span className="text-primary">Command.</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Security & Verification Matrix</p>
          </div>
          <button className="group px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-rose-500 transition-colors shadow-2xl hover:shadow-rose-500/30">
            Initiate Lockdown <Lock size={16} className="group-hover:scale-110 transition-transform" />
          </button>
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Matrix Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-2 relative bg-white rounded-[3rem] p-8 md:p-10 overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            {/* Header controls inside panel */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-100 pb-8">
              <div>
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => { setActiveSubTab('clearance'); setSearchQuery(''); }}
                    className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                      activeSubTab === 'clearance' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Entity Clearance ({companies.length})
                  </button>
                  <button 
                    onClick={() => { setActiveSubTab('tickets'); setSearchQuery(''); }}
                    className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                      activeSubTab === 'tickets' 
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Support Tickets ({tickets.length})
                  </button>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  {activeSubTab === 'clearance' ? 'Clearance Queue' : 'Tickets Roster'}
                </h2>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder={activeSubTab === 'clearance' ? "Search Company or Reg No..." : "Search Subject..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase tracking-wider placeholder:text-slate-400" 
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">Streaming telemetry...</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. Clearance Roster */}
                {activeSubTab === 'clearance' && (
                  filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => {
                      const cName = company.companyDetails?.companyName || company.name || 'Unnamed Corporate';
                      const regNo = company.companyDetails?.registrationNumber || 'REG-PENDING';
                      const isVerified = company.isAdminApproved;
                      
                      return (
                        <div key={company._id} className="group p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-200 hover:shadow-md transition-all">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                              isVerified 
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white' 
                                : 'bg-white border-2 border-slate-200 text-slate-400'
                            }`}>
                              {isVerified ? <ShieldCheck size={24} /> : <FileText size={24} />}
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{cName}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{regNo}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                                  {company.email}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {company.companyDetails?.companyDocument && (
                              <a 
                                href={`${API_BASE_URL}${company.companyDetails.companyDocument}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors px-4 border border-slate-200 bg-white py-2 rounded-xl"
                              >
                                View Doc
                              </a>
                            )}
                            {!isVerified ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleRejectCompany(company._id)}
                                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-rose-500 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all"
                                >
                                  <XCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => handleApproveCompany(company._id)}
                                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg"
                                >
                                  Approve <CheckCircle size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className="px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                                <ShieldCheck size={14} /> Cleared
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-slate-400 italic">No companies matching filters.</div>
                  )
                )}

                {/* 2. Tickets Roster */}
                {activeSubTab === 'tickets' && (
                  filteredTickets.length > 0 ? (
                      <div key={ticket._id} className="group p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-4 hover:border-amber-200 hover:shadow-md transition-all">
                        {/* Header: Status, Category, Date/Time */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              ticket.status === 'closed' ? 'bg-slate-200 text-slate-600 border-slate-300' :
                              ticket.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-indigo-50 text-indigo-600 border-indigo-100'
                            }`}>
                              {ticket.status}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
                              {ticket.category}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
                              {ticket.type || 'Support'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(ticket.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Subject */}
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-amber-600 transition-colors">
                          {ticket.subject}
                        </h4>

                        {/* Problem Description */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                          {ticket.description}
                        </div>

                        {/* User Details & Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200/60">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                              {ticket.user?.name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-none">{ticket.user?.name || 'Unknown Student'}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">{ticket.user?.email || 'No email provided'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button 
                              onClick={() => setActiveTicket(ticket)}
                              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-md"
                            >
                              Inspect & Reply
                            </button>
                          </div>
                        </div>
                      </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 italic">No tickets in database.</div>
                  )
                )}

              </div>
            )}
          </motion.div>

          {/* Right Column: Threat Detection & Status */}
          <div className="space-y-6">
            
            {/* Threat Radar */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 relative overflow-hidden group shadow-xl"
            >
              {/* Radar Sweep Animation */}
              <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(244,63,94,0.3)_360deg)] animate-[spin_3s_linear_infinite] origin-bottom-left opacity-50 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-[1rem] flex items-center justify-center text-rose-500 mb-6 border border-white/5">
                  <Zap size={20} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Threat Detection</h3>
                
                <div className="space-y-4">
                  <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-rose-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Geolocation Anomaly</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Multiple rapid logins across regions detected for Entity #9921.</p>
                  </div>
                  
                  <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Duplicate Registration</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Entity "Rural Power" utilizing flagged credentials.</p>
                  </div>
                </div>

                <button onClick={() => toast.success("Scanning threat database...")} className="w-full mt-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                  Execute Audit Protocol
                </button>
              </div>
            </motion.div>

            {/* Ticket Resolution Dial */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-indigo-500 p-8 rounded-[3rem] border border-indigo-400 text-white relative overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3"></div>
              
              <h4 className="text-xl font-black uppercase tracking-tighter mb-8 relative z-10">Resolution Matrix</h4>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="text-center">
                  <p className="text-5xl font-black tracking-tighter">{openTicketsCount}</p>
                  <p className="text-[9px] uppercase font-black text-indigo-200 tracking-widest mt-2">Open Issues</p>
                </div>
                
                <div className="w-24 h-24 relative flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-indigo-400 fill-none" strokeWidth="8" />
                    <motion.circle 
                      cx="50" cy="50" r="40" 
                      className="stroke-white fill-none drop-shadow-md" 
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 251" }}
                      animate={{ strokeDasharray: `${(resolutionPercentage / 100) * 251} 251` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-white font-black text-sm">
                    {resolutionPercentage}%
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-5xl font-black tracking-tighter">{resolvedTicketsCount}</p>
                  <p className="text-[9px] uppercase font-black text-indigo-200 tracking-widest mt-2">Resolved</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Slide-over Inspect Ticket Drawer */}
      <AnimatePresence>
        {activeTicket && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <MessageSquare size={24} className="text-amber-400" />
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Ticket Overwatch</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Category: {activeTicket.category}</p>
                  </div>
                </div>
                <button onClick={() => setActiveTicket(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable conversation */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
                {/* User original issue info */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Original Inquiry</span>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(activeTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{activeTicket.subject}</h3>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                    {activeTicket.description}
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                        {activeTicket.user?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{activeTicket.user?.name || 'Unknown student'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{activeTicket.user?.email || ''}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">Status:</span>
                      <select 
                        value={activeTicket.status} 
                        onChange={(e) => handleUpdateTicketStatus(activeTicket._id, e.target.value)}
                        disabled={updatingTicketId !== null}
                        className="p-2 border border-slate-200 rounded-xl bg-white outline-none font-bold text-xs"
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

                {/* Timeline / responses */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CornerDownRight size={14} /> Response Thread ({activeTicket.responses?.length || 0})
                  </h4>

                  {activeTicket.responses && activeTicket.responses.length > 0 ? (
                    activeTicket.responses.map((resp, idx) => {
                      const isSupportResponder = resp.responder?.role === 'support' || resp.responder?.role === 'admin';
                      return (
                        <div 
                          key={resp._id || idx} 
                          className={`flex ${isSupportResponder ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-3 max-w-[85%] ${isSupportResponder ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSupportResponder ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              <User size={16} />
                            </div>
                            <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                              isSupportResponder 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm' 
                                : 'bg-white text-slate-800 border border-gray-100 rounded-tl-none shadow-sm'
                            }`}>
                              <p className="text-[9px] font-black uppercase tracking-wider mb-1 opacity-70">
                                {resp.responder?.name || 'Agent'} ({resp.responder?.role || 'user'})
                              </p>
                              <p>{resp.message}</p>
                              <span className="block text-[8px] mt-2 text-right opacity-60">
                                {new Date(resp.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400 italic">No responses on this thread yet. Write a response below.</div>
                  )}
                </div>

              </div>

              {/* Footer text field to reply */}
              <div className="p-6 bg-white border-t border-gray-100 flex gap-3 items-end">
                <textarea 
                  placeholder="Type responder message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none resize-none h-20 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                ></textarea>
                <button 
                  onClick={handleSendResponse}
                  disabled={!replyText.trim()}
                  className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
};

export default SupportDashboard;
