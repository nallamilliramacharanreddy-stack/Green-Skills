import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Home, BookOpen, Award, Briefcase, 
  Settings, LogOut, MessageSquare, Bell,
  Menu, X, User, Users, Shield, Trophy, Sparkles, Crown, ShieldAlert, FileText, Headphones
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useRealTime } from '../../context/RealTimeContext';
import axios from 'axios';
import { API_URL } from '../../utils/api';

const DashboardLayout = ({ children, role: propRole }) => {
  const { user, logout } = useAuth();
  let role = propRole || user?.role || 'student';
  if (user && ['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin'].includes(user.role)) {
    role = 'admin';
  } else if (['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin'].includes(role)) {
    role = 'admin';
  }
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = React.useState([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const { socket } = useRealTime();

  // Load notifications from API and fallback/sync with localStorage
  React.useEffect(() => {
    const fetchNotifications = async () => {
      const uId = user?._id || user?.id;
      if (!uId) return;

      try {
        const res = await axios.get(`${API_URL}/notifications/user/${uId}`);
        if (res.data && res.data.success) {
          const apiNotifications = res.data.notifications.map(n => ({
            id: n._id,
            title: n.title,
            message: n.message,
            read: n.read,
            link: n.link,
            createdAt: n.createdAt
          }));
          setNotifications(apiNotifications);
          localStorage.setItem(`notifications_${uId}`, JSON.stringify(apiNotifications));
        }
      } catch (err) {
        console.error("Failed to fetch notifications from API:", err);
        // Fallback to localStorage
        const stored = localStorage.getItem(`notifications_${uId}`);
        if (stored) {
          try {
            setNotifications(JSON.parse(stored));
          } catch (e) {}
        }
      }
    };

    fetchNotifications();
  }, [user]);

  // Save notifications to localStorage helper
  const saveNotifications = (updated) => {
    setNotifications(updated);
    if (user?._id || user?.id) {
      const uId = user._id || user.id;
      localStorage.setItem(`notifications_${uId}`, JSON.stringify(updated));
    }
  };

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to socket alerts to fetch new notifications dynamically
  React.useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        if (data.message && (data.message.includes('New Support Ticket raised') || data.message.includes('Ticket unsent'))) {
          const uId = user?._id || user?.id;
          if (uId) {
            axios.get(`${API_URL}/notifications/user/${uId}`)
              .then(res => {
                if (res.data && res.data.success) {
                  const apiNotifications = res.data.notifications.map(n => ({
                    id: n._id,
                    title: n.title,
                    message: n.message,
                    read: n.read,
                    link: n.link,
                    createdAt: n.createdAt
                  }));
                  setNotifications(apiNotifications);
                  localStorage.setItem(`notifications_${uId}`, JSON.stringify(apiNotifications));
                }
              })
              .catch(e => console.error("Error updating notifications on socket event:", e));
          }
        }
      };
      socket.on('receive_message', handleNewMessage);
      return () => {
        socket.off('receive_message', handleNewMessage);
      };
    }
  }, [socket, user]);

  const handleNotificationClick = async (notif) => {
    const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
    saveNotifications(updated);
    setShowNotifications(false);

    try {
      await axios.patch(`${API_URL}/notifications/${notif.id}/read`);
    } catch (err) {
      console.error("Failed to mark notification as read on server:", err);
    }

    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleClearAll = async () => {
    saveNotifications([]);
    setShowNotifications(false);

    const uId = user?._id || user?.id;
    if (uId) {
      try {
        await axios.delete(`${API_URL}/notifications/user/${uId}/clear-all`);
      } catch (err) {
        console.error("Failed to clear notifications on server:", err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);

    const uId = user?._id || user?.id;
    if (uId) {
      try {
        await axios.patch(`${API_URL}/notifications/user/${uId}/read-all`);
      } catch (err) {
        console.error("Failed to mark all read on server:", err);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const [isSidebarOpen, setSidebarOpen] = React.useState(typeof window !== 'undefined' ? window.innerWidth > 768 : false);
  const [currentLang, setCurrentLang] = React.useState('en');

  React.useEffect(() => {
    // Read Google Translate cookie to set initial language
    const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
    if (match && match[1]) {
      const parts = match[1].split('/');
      const lang = parts[parts.length - 1];
      if (lang) {
        setCurrentLang(lang);
      }
    }
  }, []);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setCurrentLang(newLang);
    
    // Attempt to trigger existing Google Translate combo box
    const selectElement = document.querySelector('.goog-te-combo');
    if (selectElement) {
      selectElement.value = newLang;
      selectElement.dispatchEvent(new Event('change'));
    } else {
      // Fallback: forcefully set cookie and reload the page
      document.cookie = `googtrans=/en/${newLang}; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=/en/${newLang}; path=/`; // some browsers need this without domain
      window.location.reload();
    }
  };

  const menuConfig = {
    student: [
      { category: 'LEARNING', items: [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: BookOpen, label: 'My Journey', path: '/dashboard/journey' },
        { icon: Award, label: 'Courses', path: '/dashboard/courses' },
        { icon: MessageSquare, label: 'Quiz', path: '/dashboard/quiz' },
      ]},
      { category: 'ACHIEVEMENTS', items: [
        { icon: Crown, label: 'Premium Hub', path: '/dashboard/premium' },
      ]},
      { category: 'CAREERS', items: [
        { icon: Briefcase, label: 'Apply Jobs', path: '/dashboard/hiring' },
        { icon: FileText, label: 'Hiring Exams', path: '/dashboard/hiring-exams' },
      ]},
      { category: 'ACCOUNT', items: [
        { icon: User, label: 'Profile', path: '/dashboard/profile' },
      ]}
    ],
    employer: [
      { category: 'CORE', items: [
        { icon: Trophy, label: 'Leaderboard', path: '/employer' },
      ]},
      { category: 'RECRUITMENT', items: [
        { icon: Briefcase, label: 'Job Details', path: '/employer/jobs' },
        { icon: MessageSquare, label: 'Applications', path: '/employer/applications' },
        { icon: Users, label: 'Shortlisted Users', path: '/employer/shortlisted' },
        { icon: User, label: 'User', path: '/employer/candidates' },
        { icon: Award, label: 'Hired Users', path: '/employer/hired' },
      ]},
      { category: 'ASSESSMENT', items: [
        { icon: BookOpen, label: 'Exams', path: '/employer/exams' },
      ]},
      { category: 'ACCOUNT', items: [
        { icon: User, label: 'Profile', path: '/employer/profile' },
      ]}
    ],
    admin: [
      { category: 'SYSTEM', items: [
        { icon: Home, label: 'Dashboard', path: '/admin' },
      ]},
      { category: 'MANAGEMENT', items: [
        { icon: BookOpen, label: 'Manage Courses', path: '/admin/courses' },
        { icon: MessageSquare, label: 'Quiz Management', path: '/admin/quizzes' },
        { icon: Shield, label: 'AI Proctoring', path: '/admin/proctoring' },
        { icon: ShieldAlert, label: 'Integrity Report', path: '/admin/integrity' },
        { icon: Headphones, label: 'Support Tickets', path: '/support' },
      ]},
      { category: 'DATA & USERS', items: [
        { icon: Award, label: 'Leaderboard', path: '/admin/leaderboard' },
        { icon: User, label: 'User', path: '/admin/users' },
      ]},
      { category: 'ACCOUNT', items: [
        { icon: User, label: 'Profile', path: '/admin/profile' },
      ]}
    ],
    support: [
      { category: 'SYSTEM', items: [
        { icon: Home, label: 'Overwatch Command', path: '/support' },
      ]},
      { category: 'ACCOUNT', items: [
        { icon: User, label: 'Profile', path: '/support/profile' },
      ]}
    ]
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const activeCategories = menuConfig[role] || menuConfig.student;

  const isRootDashboard = ['/dashboard', '/admin', '/employer'].includes(location.pathname);
  
  const getPageTitle = () => {
    for (const category of activeCategories) {
      for (const item of category.items) {
        if (item.path === location.pathname) {
          return item.label;
        }
      }
    }
    const parts = location.pathname.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1) : 'Dashboard Overview';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-[#00E5FF]/30">
      
      {/* 
        ULTRA-PREMIUM SIDEBAR 
        Glassmorphism, Depth, Neon Glows, Apple-level polish
      */}
      <aside className={`${isSidebarOpen ? 'w-[300px]' : 'w-[90px]'} bg-[#0A1224]/95 backdrop-blur-[40px] border-r border-[#00E5FF]/10 transition-all duration-[500ms] ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col fixed h-full z-50 overflow-hidden shadow-[20px_0_80px_rgba(0,0,0,0.4)]`}>
        
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[50%] bg-[#00E5FF]/10 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[150%] h-[50%] bg-[#7C3AED]/10 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPjwvc3ZnPg==')] opacity-50"></div>
        </div>

        {/* Sidebar Header (Hamburger) */}
        <div className={`p-6 flex items-center justify-between relative z-20 ${!isSidebarOpen && 'justify-center'}`}>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6 scrollbar-hide relative z-20 mt-4">
          {activeCategories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-2">
              {isSidebarOpen && (
                <h3 className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                  {category.category}
                </h3>
              )}
              
              <div className="space-y-1">
                {category.items.map((item, i) => {
                  const isActive = location.pathname === item.path;
                  const isPremium = item.label === 'Premium Hub';

                  return (
                    <Link 
                      key={i} 
                      to={item.path}
                      className={`relative flex items-center ${isSidebarOpen ? 'gap-4 px-3 py-3' : 'justify-center p-3'} rounded-2xl transition-all duration-300 group overflow-hidden ${
                        isActive 
                          ? 'bg-gradient-to-r from-[#4F46E5]/20 to-[#7C3AED]/10 border border-[#4F46E5]/30 shadow-[0_0_30px_rgba(79,70,229,0.15)]' 
                          : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                      }`}
                      title={!isSidebarOpen ? item.label : undefined}
                    >
                      {/* Active Left Glow Bar */}
                      {isActive && (
                        <motion.div layoutId="activeNav" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#00E5FF] rounded-r-full shadow-[0_0_15px_#00E5FF]" />
                      )}
                      
                      {/* Icon Container */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 relative z-10 ${
                        isActive 
                          ? 'bg-gradient-to-br from-[#00E5FF] to-[#4F46E5] shadow-[0_0_20px_rgba(0,229,255,0.4)] text-white scale-110' 
                          : isPremium 
                            ? 'bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 text-[#FFD700] group-hover:bg-[#FFD700]/30 border border-[#FFD700]/20 group-hover:border-[#FFD700]/50' 
                            : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white border border-white/5 group-hover:border-white/20'
                      }`}>
                        {isPremium && <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>}
                        <item.icon size={isActive ? 20 : 18} className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'group-hover:scale-110'}`} />
                      </div>
                      
                      {/* Label */}
                      {isSidebarOpen && (
                        <span className={`font-bold text-sm tracking-wide z-10 transition-colors flex-1 ${
                          isActive 
                            ? 'text-white' 
                            : isPremium 
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]' 
                              : 'text-gray-400 group-hover:text-gray-200'
                        }`}>
                          {item.label}
                        </span>
                      )}

                      {/* Hover Glass Effect */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-[800ms] pointer-events-none"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Section */}
        <div className="p-5 border-t border-white/5 relative z-20 bg-black/20 backdrop-blur-md">
          <button 
            onClick={handleLogout}
            className={`flex items-center w-full rounded-2xl bg-gradient-to-r from-[#FF3B30]/10 to-[#FF5F6D]/5 border border-[#FF3B30]/20 text-[#FF5F6D] hover:text-white hover:from-[#FF3B30]/90 hover:to-[#FF5F6D]/90 transition-all duration-300 shadow-[0_4px_20px_rgba(255,59,48,0.1)] hover:shadow-[0_8px_30px_rgba(255,59,48,0.5)] group overflow-hidden ${isSidebarOpen ? 'p-3.5 gap-4' : 'p-3 justify-center'}`}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="w-9 h-9 rounded-xl bg-[#FF3B30]/10 group-hover:bg-white/20 flex items-center justify-center transition-all relative z-10 border border-[#FF3B30]/20 group-hover:border-white/30">
              <LogOut size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform drop-shadow-md" />
            </div>
            
            {isSidebarOpen && <span className="font-black tracking-[0.15em] text-xs relative z-10">DISCONNECT</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ${isSidebarOpen ? 'ml-[300px]' : 'ml-[90px]'} transition-all duration-[500ms] ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col min-h-screen relative z-10`}>
        {/* Header */}
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              {isRootDashboard && (
                <>
                  <span className="text-[10px] md:text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#4F46E5] tracking-[0.2em] uppercase drop-shadow-sm mb-0.5">
                    Welcome Back
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight drop-shadow-sm">
                    {user?.name}
                  </h2>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 sm:gap-8">
            <select 
              value={currentLang}
              onChange={handleLanguageChange} 
              className="bg-slate-50 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00E5FF] cursor-pointer hover:bg-white hover:border-slate-300 transition-all hidden sm:block shadow-sm outline-none appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_12px_center]"
            >
              <option value="en">English (Default)</option>
              <optgroup label="Indian Languages">
                <option value="hi">हिंदी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
                <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="or">ଓଡ଼ିଆ (Odia)</option>
                <option value="as">অসমীয়া (Assamese)</option>
                <option value="ur">اردو (Urdu)</option>
              </optgroup>
            </select>

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 rounded-full border transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group ${
                  showNotifications 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30'
                }`}
              >
                <Bell size={22} className="group-hover:animate-wiggle" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Notifications</h4>
                        {unreadCount > 0 && (
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mt-0.5">{unreadCount} UNREAD ALERTS</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllRead}
                            className="text-[9px] font-black text-slate-500 hover:text-primary uppercase tracking-widest transition-colors cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button 
                            onClick={handleClearAll}
                            className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 relative ${
                              !notif.read ? 'bg-primary/5' : ''
                            }`}
                          >
                            {!notif.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            )}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              notif.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-primary/10 text-primary'
                            }`}>
                              <Bell size={16} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs uppercase tracking-wider ${!notif.read ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                  {notif.title}
                                </p>
                                <span className="text-[9px] text-slate-400 font-bold">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs italic">
                          No notifications to display.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link to={role === 'student' ? '/dashboard/profile' : `/${role}/profile`} className="flex items-center gap-4 pl-8 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity select-none group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">{user?.name}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{role}</p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00E5FF] to-[#4F46E5] rounded-full p-[2px] shadow-lg group-hover:shadow-[#00E5FF]/30 transition-shadow">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-slate-800 font-black text-lg">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-10 flex-1 bg-gradient-to-br from-slate-50 to-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Global Styles for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes border-travel {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default DashboardLayout;
