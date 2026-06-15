import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, CheckCircle,
  Users, BookOpen, Briefcase, Award,
  Play, Image as ImageIcon, Search,
  Filter, MoreVertical, X, Check, AlertCircle,
  LayoutDashboard, Minus, UserCheck, Shield, Lock,
  GraduationCap, Bell, Settings, MessageSquare,
  TrendingUp, FileText, Share2, Activity,
  Upload, Video, Clock, Tag, Zap, Crown, Flame, ChevronLeft, ChevronRight, Building
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStreak } from '../../context/StreakContext';
import { getStreakRank } from '../../utils/streakRank';
import AdminProctoring from './AdminProctoring';
import { API_URL, API_BASE_URL } from '../../utils/api';

const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';
  let videoId = '';
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&#]+)/);
  if (watchMatch) videoId = watchMatch[1];
  else if (shortMatch) videoId = shortMatch[1];
  else if (embedMatch) videoId = embedMatch[1];
  else {
    const parts = url.split('/');
    videoId = parts[parts.length - 1];
  }
  return `https://www.youtube.com/embed/${videoId}`;
};

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 min-h-screen">
          <h1 className="text-3xl font-bold mb-4">Dashboard Crashed!</h1>
          <p className="font-mono bg-white p-4 rounded shadow">
            {this.state.error?.toString()}
          </p>
          <pre className="font-mono text-sm mt-4 bg-white p-4 rounded shadow overflow-auto max-h-96">
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminDashboard = () => {
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data States
  const [users, setUsers] = useState([]);
  const [hirers, setHirers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0, activeUsers: 0, suspendedUsers: 0,
    totalHirers: 0, totalCourses: 0, totalQuizzes: 0, completedQuizzes: 0
  });

  const MAIN_ADMIN = 'nallamilliramacharanreddy@gmail.com';

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'admin') setActiveTab('dashboard');
    else if (path === 'quizzes') setActiveTab('quizzes');
    else setActiveTab(path);
  }, [location]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, h, c, l, a] = await Promise.all([
        axios.get(`${API_URL}/auth/users`),
        axios.get(`${API_URL}/auth/hirers`),
        axios.get(`${API_URL}/courses`),
        axios.get(`${API_URL}/streak/leaderboard`),
        axios.get(`${API_URL}/auth/admins`)
      ]);

      setUsers(u.data || []);
      setHirers(h.data || []);
      setCourses(c.data || []);
      setLeaderboard(l.data || []);
      setAdmins(a.data || []);

      setStats({
        totalUsers: u.data?.length || 0,
        activeUsers: u.data?.filter(x => !x.isSuspended).length || 0,
        suspendedUsers: u.data?.filter(x => x.isSuspended).length || 0,
        totalHirers: h.data?.length || 0,
        totalCourses: c.data?.length || 0,
        totalQuizzes: c.data?.filter(x => x.quiz?.length > 0).length || 0,
        completedQuizzes: u.data?.reduce((acc, curr) => acc + (curr.quizScores?.length || 0), 0)
      });
    } catch (error) {
      console.error("Fetch Error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleApproveAdmin = async (id) => {
    try {
      await axios.patch(`${API_URL}/auth/admins/${id}/approve`);
      toast.success('Admin Authorized');
      fetchData();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleApproveHirer = async (id) => {
    try {
      await axios.patch(`${API_URL}/auth/hirers/${id}/approve`);
      toast.success('Hirer Access Granted');
      fetchData();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleRejectHirer = async (id) => {
    if (window.confirm('Are you sure you want to REJECT and DELETE this hirer registration?')) {
      try {
        await axios.delete(`${API_URL}/auth/hirers/${id}/reject`);
        toast.success('Hirer application rejected');
        fetchData();
      } catch (error) {
        toast.error('Rejection failed');
      }
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await axios.patch(`${API_URL}/auth/users/${user._id}/status`, { isSuspended: !user.isSuspended });
      toast.success(user.isSuspended ? 'User restored' : 'User suspended');
      fetchData();
    } catch (error) {
      toast.error('Status update failed');
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm('WARNING: Deleted users must re-register from scratch. Proceed?')) {
      try {
        await axios.delete(`${API_URL}/auth/users/${id}`);
        toast.success('Identity purged');
        fetchData();
      } catch (error) {
        toast.error('Purge failed');
      }
    }
  };

  const handleSuspensionAction = async (id, action) => {
    try {
      await axios.post(`${API_URL}/auth/handle-suspension/${id}`, { action });
      toast.success(`Request ${action}ed`);
      fetchData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const generateCourseContent = async (id) => {
    try {
      toast.loading('AI Nexus generating 20 Lessons, 5 Tasks & 50 MCQ...', { id: 'courseContent' });
      await axios.post(`${API_URL}/courses/${id}/generate-quiz`);
      toast.success('Course Architecture Deployed Successfully', { id: 'courseContent' });
      fetchData();
    } catch (error) {
      toast.error('AI Generation Failed', { id: 'courseContent' });
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course? This will remove it for ALL users.')) {
      try {
        await axios.delete(`${API_URL}/courses/${id}`);
        toast.success('Course Removed Globally');
        fetchData();
      } catch (error) {
        toast.error('Deletion Failed');
      }
    }
  };

  return (
    <DashboardErrorBoundary>
      <DashboardLayout role="admin">
        <div className="max-w-[1600px] mx-auto py-6 px-4">

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardOverview stats={stats} users={users} hirers={hirers} courses={courses} />}
              {activeTab === 'courses' && <ManageCourses courses={courses} onGenQuiz={generateCourseContent} onDeleteCourse={handleDeleteCourse} refresh={fetchData} users={users} />}
              {activeTab === 'leaderboard' && <AdminLeaderboard data={leaderboard} />}
              {activeTab === 'users' && <UserDataManagement data={users} onToggleStatus={toggleUserStatus} onDelete={deleteUser} onHandleRequest={handleSuspensionAction} />}
              {activeTab === 'hirers' && <HirerDataManagement data={hirers} onToggleStatus={toggleUserStatus} onDelete={deleteUser} onApprove={handleApproveHirer} onReject={handleRejectHirer} />}
              {activeTab === 'quizzes' && <QuizManagement courses={courses} onGenQuiz={generateCourseContent} refresh={fetchData} />}
              {activeTab === 'proctoring' && <AdminProctoring />}
              {activeTab === 'admins' && <AdminApproval data={admins} onApprove={handleApproveAdmin} onToggleStatus={toggleUserStatus} onDelete={deleteUser} />}
              {activeTab === 'profile' && <AdminProfile currentUser={currentUser} refreshUser={fetchData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </DashboardLayout>
    </DashboardErrorBoundary>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600"
      >
        <ChevronLeft size={20} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm transition-all ${currentPage === page
            ? 'bg-slate-200 text-slate-900'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

/* ==================================================
   1. DASHBOARD OVERVIEW
   ================================================== */
const DashboardOverview = ({ stats, users, hirers, courses }) => (
  <div className="space-y-12">
    <div className="flex flex-col gap-2">
      <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">Control Center</h2>
      <p className="text-slate-500 font-medium tracking-tight text-lg">System-wide performance and identity matrix.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'emerald' },
        { label: 'Active Sessions', value: stats.activeUsers, icon: Activity, color: 'blue' },
        { label: 'Suspended', value: stats.suspendedUsers, icon: Shield, color: 'red' },
        { label: 'Hirers', value: stats.totalHirers, icon: Briefcase, color: 'purple' },
        { label: 'Courses', value: stats.totalCourses, icon: BookOpen, color: 'orange' },
        { label: 'Quizzes Gen', value: stats.totalQuizzes, icon: MessageSquare, color: 'indigo' },
        { label: 'Completions', value: stats.completedQuizzes, icon: CheckCircle, color: 'pink' },
        { label: 'Platform Load', value: '0.4ms', icon: LayoutDashboard, color: 'slate' }
      ].map((s, i) => (
        <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4 hover:scale-[1.02] transition-all">
          <div className={`w-14 h-14 rounded-2xl bg-${s.color}-50 flex items-center justify-center`}>
            <s.icon className={`text-${s.color}-600`} size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{s.value}</h4>
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 italic flex items-center gap-3">
          <Users className="text-primary" /> Recent Users
        </h3>
        <div className="space-y-4">
          {users?.slice(0, 5).map(u => (
            <div key={u._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black uppercase text-xs">{u.name?.[0]}</div>
                <div>
                  <p className="font-black text-slate-900 text-sm uppercase">{u.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-400 italic">NEW</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 italic flex items-center gap-3">
          <Building className="text-blue-500" /> Recent Hirers
        </h3>
        <div className="space-y-4">
          {hirers?.slice(0, 5).map(h => (
            <div key={h._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 font-black uppercase text-xs">{h.companyDetails?.companyName?.[0] || h.name?.[0]}</div>
                <div>
                  <p className="font-black text-slate-900 text-sm uppercase truncate max-w-[120px]">{h.companyDetails?.companyName || h.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{h.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-400 italic">NEW</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 italic flex items-center gap-3">
          <Play className="text-red-500" /> Recent Courses
        </h3>
        <div className="space-y-4">
          {courses.slice(0, 5).map(c => (
            <div key={c._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <img src={c.coverImage} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <p className="font-black text-slate-900 text-sm uppercase">{c.title}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{c.category}</p>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-primary"><Share2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ==================================================
   2. UPDATED MANAGE COURSES MODULE
   ================================================== */
const ManageCourses = ({ courses, onGenQuiz, onDeleteCourse, refresh, users }) => {
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  const handleOpenForm = (course = null) => {
    setEditCourse(course);
    setShowForm(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Manage Courses</h2>
          <p className="text-slate-500 font-medium">Deploy and replicate knowledge across the network.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-tighter text-sm hover:bg-primary transition-all flex items-center gap-3 shadow-xl"
        >
          <Plus size={20} /> Upload New Course
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {courses.map(course => (
          <div key={course._id} className="bg-white rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl group">
            <div className="h-56 relative">
              <img src={course.coverImage || course.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-10 flex gap-2">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20">{course.category}</span>
                <span className="px-4 py-2 bg-emerald-500/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-emerald-400/20">{course.difficulty}</span>
              </div>
              <div className="absolute top-8 right-10 flex gap-2">
                <button onClick={() => handleOpenForm(course)} className="p-3 bg-white text-slate-900 rounded-2xl hover:bg-primary hover:text-white transition-all"><Edit size={18} /></button>
                <button onClick={() => onDeleteCourse(course._id)} className="p-3 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 leading-none italic">{course.title}</h3>
              <p className="text-slate-500 font-medium mb-6 text-xs line-clamp-2">{course.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{course.duration}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <Play size={14} className="text-red-500" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{course.videoSource} Source</span>
                </div>
              </div>

                <button
                  onClick={() => onGenQuiz(course._id)}
                  className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-[20px] border border-emerald-100 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-3 mb-5"
                >
                  <Award size={16} /> Deploy 20 Lessons & 5 AI Tasks
                </button>

                <div className="pt-5 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Registered Users</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const enrolledUsers = users?.filter(u => {
                        const cid = course._id?.toString();
                        const inCurrent = u.progress?.currentCourses?.some(id => id?.toString() === cid);
                        const inCompleted = u.progress?.completedCourses?.some(id => id?.toString() === cid);
                        const inEnrolled = course.enrolledStudents?.some(id => id?.toString() === u._id?.toString());
                        return inCurrent || inCompleted || inEnrolled;
                      }) || [];
                      
                      if (enrolledUsers.length === 0) {
                        return <p className="text-xs font-semibold text-slate-500 italic">No users registered yet.</p>;
                      }
                      
                      return enrolledUsers.map(user => (
                        <div key={user._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs flex-shrink-0">
                            {user.name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest truncate">{user.email}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
        ))}
      </div>

      {showForm && (
        <CourseUploadForm
          course={editCourse}
          onClose={() => setShowForm(false)}
          refresh={refresh}
        />
      )}
    </div>
  );
};

const CourseUploadForm = ({ course, onClose, refresh }) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || 'Green Skill',
    difficulty: course?.difficulty || 'Beginner',
    duration: course?.duration || '',
    skillTags: course?.skillTags?.join(', ') || '',
    coverImage: course?.coverImage || '',
    videoSource: course?.videoSource || 'youtube',
    lessons: course?.lessons?.length > 0
      ? course.lessons
      : Array(1).fill().map((_, i) => ({
        moduleTitle: `Lesson 1`,
        title: `Video 1`,
        videoSource: 'youtube',
        youtubeLink: '',
        duration: '10:00'
      })),
    tasks: course?.tasks?.length > 0 ? course.tasks : Array(5).fill().map((_, i) => ({
      title: `Task ${i + 1}`,
      description: '',
      type: 'Assignment'
    }))
  });

  const [previews, setPreviews] = useState({
    cover: course?.coverImage || null,
    video: course?.directVideoUrl || null
  });

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'cover') {
        setPreviews(prev => ({ ...prev, cover: url }));
        setFormData(prev => ({ ...prev, coverImage: url })); // Simulating upload
      } else {
        setPreviews(prev => ({ ...prev, video: url }));
        setFormData(prev => ({ ...prev, directVideoUrl: url })); // Simulating upload
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validLessons = formData.lessons.filter(l => l.youtubeLink?.trim() || l.directVideoUrl?.trim());

      const uniqueModules = [...new Set(validLessons.map(l => l.moduleTitle))];
      let isValid = true;
      for (const moduleTitle of uniqueModules) {
        const moduleVideos = validLessons.filter(l => l.moduleTitle === moduleTitle);
        if (moduleVideos.length < 1) {
          isValid = false;
          break;
        }
      }

      if (uniqueModules.length === 0 || !isValid) {
        toast.error('You must have at least 1 lesson with 1 valid video.');
        return;
      }

      const data = {
        ...formData,
        lessons: validLessons,
        skillTags: formData.skillTags.split(',').map(s => s.trim())
      };

      if (course) {
        await axios.put(`${API_URL}/courses/${course._id}`, data);
        toast.success('Course Replicated Globally');
      } else {
        await axios.post(`${API_URL}/courses`, data);
        toast.success('Course Deployed to All Users');
      }
      refresh();
      onClose();
    } catch (error) {
      toast.error('Deployment Failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-4xl h-[90vh] overflow-y-auto rounded-[64px] shadow-2xl p-12 border border-white/20"
      >
        <button onClick={onClose} className="absolute top-10 right-10 p-4 bg-slate-50 rounded-full hover:bg-slate-100 transition-all text-slate-400">
          <X size={24} />
        </button>

        <div className="mb-12">
          <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic italic">Course Architecture</h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2 italic">Design and deploy knowledge nodes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12 pb-12">
          {/* Section 1: Visual Asset */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> 1. Upload Cover Page
            </h4>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div
                onClick={() => fileInputRef.current.click()}
                className="w-full md:w-80 h-48 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-all overflow-hidden group"
              >
                {previews.cover ? (
                  <div className="relative w-full h-full">
                    <img src={previews.cover} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <Edit className="text-white" size={32} />
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="text-slate-300" size={40} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Image (JPG/PNG/WEBP)</p>
                  </>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <p className="text-sm text-slate-500 font-medium">This image will be displayed on the user dashboard card and course entry page. High resolution recommended.</p>
                {previews.cover && (
                  <button type="button" onClick={() => setPreviews(p => ({ ...p, cover: null }))} className="px-6 py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                    <Trash2 size={14} /> Delete Cover Image
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'cover')} />
            </div>
          </div>

          {/* Section 2: Lesson Matrix */}
          <div className="space-y-8 bg-slate-50 p-10 rounded-[48px] border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 italic">
                <Video size={14} className="text-primary" /> 2. Lesson Architecture (Dynamic Lessons & Videos)
              </h4>
              <button
                type="button"
                onClick={() => {
                  const uniqueModules = [...new Set(formData.lessons.map(l => l.moduleTitle))];
                  const nextModuleNum = uniqueModules.length + 1;
                  setFormData(p => ({
                    ...p,
                    lessons: [
                      ...p.lessons,
                      {
                        moduleTitle: `Lesson ${nextModuleNum}`,
                        title: `Video 1`,
                        videoSource: 'youtube',
                        youtubeLink: '',
                        duration: '10:00'
                      }
                    ]
                  }));
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex items-center gap-2 shadow-lg"
              >
                <Plus size={14} /> Add Lesson
              </button>
            </div>

            <div className="space-y-12">
              {[...new Set(formData.lessons.map(l => l.moduleTitle))].map((moduleTitle, moduleIdx) => (
                <div key={moduleIdx} className="space-y-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">{moduleIdx + 1}</div>
                      <h5 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{moduleTitle}</h5>
                    </div>
                    {moduleIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newLessons = formData.lessons.filter(l => l.moduleTitle !== moduleTitle);
                          setFormData(p => ({ ...p, lessons: newLessons }));
                        }}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        title="Delete Lesson"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {formData.lessons.map((lesson, idx) => {
                      if (lesson.moduleTitle !== moduleTitle) return null;
                      
                      const localIdx = formData.lessons.slice(0, idx).filter(l => l.moduleTitle === moduleTitle).length;

                      return (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 relative group">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Video {localIdx + 1} {localIdx === 0 && <span className="text-red-500 ml-1" title="Mandatory">*</span>}</span>
                            {localIdx > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newLessons = formData.lessons.filter((_, i) => i !== idx);
                                  setFormData(p => ({ ...p, lessons: newLessons }));
                                }}
                                className="text-red-400 hover:text-red-500 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          <input
                            value={lesson.title}
                            onChange={(e) => {
                              const newLessons = [...formData.lessons];
                              newLessons[idx].title = e.target.value;
                              setFormData(p => ({ ...p, lessons: newLessons }));
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-primary transition-all"
                            placeholder="Video Title..."
                          />
                          <div className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                              <Play className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                              <input
                                value={lesson.youtubeLink || lesson.directVideoUrl || ''}
                                onChange={(e) => {
                                  const newLessons = [...formData.lessons];
                                  newLessons[idx].youtubeLink = e.target.value;
                                  newLessons[idx].directVideoUrl = ''; // Clear direct video if youtube link is pasted
                                  setFormData(p => ({ ...p, lessons: newLessons }));
                                }}
                                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:border-primary transition-all placeholder:text-slate-300"
                                placeholder={lesson.directVideoUrl ? "Uploaded MP4 File Attached" : "YouTube Link..."}
                                disabled={!!lesson.directVideoUrl}
                              />
                            </div>
                            
                            <label className={`shrink-0 p-2 border border-slate-200 rounded-lg cursor-pointer transition-all flex items-center justify-center ${lesson.status === 'uploading' ? 'bg-primary/10 border-primary text-primary' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                              {lesson.status === 'uploading' ? (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Video size={14} />
                              )}
                              <input 
                                type="file" 
                                accept="video/mp4,video/webm" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;

                                  // Set uploading state locally
                                  const tempLessons = [...formData.lessons];
                                  tempLessons[idx].status = 'uploading';
                                  setFormData(p => ({ ...p, lessons: tempLessons }));

                                  const formDataObj = new FormData();
                                  formDataObj.append('video', file);

                                  try {
                                    const response = await axios.post(`${API_URL}/videos/upload`, formDataObj, {
                                      headers: { 'Content-Type': 'multipart/form-data' }
                                    });
                                    
                                    const newLessons = [...formData.lessons];
                                    newLessons[idx].directVideoUrl = response.data.directVideoUrl;
                                    newLessons[idx].youtubeLink = ''; // Clear youtube link since we have direct file
                                    newLessons[idx].status = 'completed';
                                    setFormData(p => ({ ...p, lessons: newLessons }));
                                    toast.success('Video uploaded successfully!');
                                  } catch (error) {
                                    console.error('Upload failed:', error);
                                    toast.error('Video upload failed');
                                    const newLessons = [...formData.lessons];
                                    newLessons[idx].status = '';
                                    setFormData(p => ({ ...p, lessons: newLessons }));
                                  }
                                }} 
                              />
                            </label>
                            
                            {lesson.directVideoUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newLessons = [...formData.lessons];
                                  newLessons[idx].directVideoUrl = '';
                                  setFormData(p => ({ ...p, lessons: newLessons }));
                                }}
                                className="shrink-0 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const localVideosCount = formData.lessons.filter(l => l.moduleTitle === moduleTitle).length;
                        setFormData(p => ({
                          ...p,
                          lessons: [
                            ...p.lessons,
                            {
                              moduleTitle: moduleTitle,
                              title: `Video ${localVideosCount + 1}`,
                              videoSource: 'youtube',
                              youtubeLink: '',
                              duration: '10:00'
                            }
                          ]
                        }));
                      }}
                      className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all min-h-[100px]"
                    >
                      <Plus size={20} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Video</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 italic mb-6">
                <BookOpen size={14} className="text-blue-500" /> 3. Industrial Tasks (5 Slots)
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {formData.tasks.map((task, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 flex gap-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs">{idx + 1}</div>
                    <div className="flex-1 space-y-3">
                      <input
                        value={task.title}
                        onChange={(e) => {
                          const newTasks = [...formData.tasks];
                          newTasks[idx].title = e.target.value;
                          setFormData(p => ({ ...p, tasks: newTasks }));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white"
                        placeholder="Task Title..."
                      />
                      <textarea
                        value={task.description}
                        onChange={(e) => {
                          const newTasks = [...formData.tasks];
                          newTasks[idx].description = e.target.value;
                          setFormData(p => ({ ...p, tasks: newTasks }));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-medium outline-none focus:bg-white h-20"
                        placeholder="Task Description..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Core Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Course Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all font-black uppercase italic text-lg tracking-tighter"
                placeholder="Enterprise Module Title..."
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all font-medium h-32"
                placeholder="Core objective and syllabus..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white transition-all font-black uppercase text-xs italic"
              >
                <option>Green Skill</option>
                <option>Digital Literacy</option>
                <option>Agriculture</option>
                <option>Energy</option>
                <option>Management</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Difficulty Level</label>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                {['Beginner', 'Intermediate', 'Expert'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, difficulty: level }))}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.difficulty === level ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Estimated Duration</label>
              <div className="relative">
                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={formData.duration}
                  onChange={(e) => setFormData(p => ({ ...p, duration: e.target.value }))}
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white transition-all font-bold text-sm"
                  placeholder="e.g., 4.5 Hours"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Skill Tags</label>
              <div className="relative">
                <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={formData.skillTags}
                  onChange={(e) => setFormData(p => ({ ...p, skillTags: e.target.value }))}
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white transition-all font-bold text-sm"
                  placeholder="Comma separated: Solar, Grid, Repair"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-10">
            <button type="submit" className="flex-1 py-6 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-tighter text-sm hover:bg-primary transition-all shadow-2xl flex items-center justify-center gap-3">
              <Shield size={20} /> {course ? 'Commit Changes and Replicate' : 'Deploy Course to All Users'}
            </button>
            <button type="button" onClick={onClose} className="px-12 py-6 bg-slate-50 text-slate-400 rounded-[24px] font-black uppercase tracking-tighter text-sm hover:bg-slate-100 transition-all border border-slate-100">
              Abort
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ==================================================
   3. LEADERBOARD
   ================================================== */
const AdminLeaderboard = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const safeData = Array.isArray(data) ? data : [];
  const totalPages = Math.ceil(safeData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = safeData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Global Leaderboard</h2>
        <p className="text-slate-500 font-medium">Top performing learners powered by the Streak Engine.</p>
      </div>

      <div className="bg-slate-900 rounded-[48px] border border-slate-800 shadow-2xl overflow-hidden p-8">
        <div className="grid grid-cols-1 gap-4">
          {currentData.map((user, index) => {
            const idx = startIndex + index;
            const userLevel = user.ultraStreak?.currentStreak || 0;
            const rankInfo = getStreakRank(userLevel);
            const isTop3 = idx < 3;
            let crownColor = idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-transparent';

            return (
              <div key={user._id} className="flex items-center p-4 rounded-2xl border transition-all hover:scale-[1.01] bg-white/5" style={{ borderColor: `${rankInfo.color}30`, boxShadow: `0 0 10px ${rankInfo.color}05` }}>
                <div className="w-12 h-12 flex flex-col items-center justify-center font-black text-xl text-white/50 relative">
                  {isTop3 && <Crown className={`w-6 h-6 absolute -top-4 ${crownColor} animate-pulse`} />}
                  #{idx + 1}
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden mx-4 flex-shrink-0 border-2 shadow-sm" style={{ borderColor: rankInfo.color, boxShadow: `0 0 10px ${rankInfo.color}50` }}>
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold bg-slate-800 text-white text-lg uppercase">{user.name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-[200px] flex items-center gap-3">
                  <h4 className="font-black text-xl text-white tracking-tight uppercase truncate">{user.name}</h4>
                </div>


                <div className="text-right flex items-center gap-6 px-4">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Current Streak</p>
                    <p className="font-black text-xl flex items-center gap-1 justify-end" style={{ color: rankInfo.color }}>
                      <Flame className="w-4 h-4" /> {userLevel} <span className="text-[10px] text-slate-500">Days</span>
                    </p>
                  </div>
                  <div className="pl-6 border-l border-white/10">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">XP Points</p>
                    <p className="font-black text-xl text-yellow-400 tracking-tighter">
                      {user.ultraStreak?.leaderboardPoints || 0}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

/* ==================================================
   4. USER DATA MANAGEMENT
   ================================================== */
const UserDataManagement = ({ data, onToggleStatus, onDelete, onHandleRequest }) => {
  const safeData = Array.isArray(data) ? data : [];
  const pendingRequests = safeData.filter(u => u.suspensionRequest?.status === 'pending');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(safeData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = safeData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">User Repository</h2>
          <p className="text-slate-500 font-medium">Manage learner identities and access states.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input className="pl-16 pr-10 py-5 bg-white border border-slate-100 rounded-[24px] outline-none shadow-lg focus:border-primary/50 font-black uppercase text-xs w-96 tracking-tighter" placeholder="Scan Identity Chain..." />
        </div>
      </div>

      {/* Pending Re-activation Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 rounded-[40px] border border-amber-100 p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-900 uppercase tracking-tighter italic">Pending Re-activation Requests</h3>
              <p className="text-amber-700/60 font-bold uppercase text-[10px] tracking-widest">Awaiting Admin Authorization</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(u => (
              <div key={u._id} className="bg-white p-6 rounded-3xl border border-amber-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">{u.name?.[0]}</div>
                  <div>
                    <p className="font-black text-slate-900 uppercase text-sm">{u.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onHandleRequest(u._id, 'accept')}
                    className="p-3 bg-white border border-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50 group/btn"
                  >
                    <Check size={18} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => onHandleRequest(u._id, 'reject')}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-50 group/btn"
                  >
                    <X size={18} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            <tr>
              <th className="px-10 py-8">ID Profile</th>
              <th className="px-10 py-8">Contact Info</th>
              <th className="px-10 py-8">Skills Matrix</th>
              <th className="px-10 py-8">Status</th>
              <th className="px-10 py-8 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Array.isArray(currentData) && currentData.map(u => (
              <tr key={u._id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black group-hover:bg-slate-900 group-hover:text-white transition-all text-sm uppercase">{u.name?.[0]}</div>
                    <span className="font-black text-slate-900 uppercase tracking-tighter text-lg">{u.name}</span>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{u.email}</p>
                    <p className="text-[10px] text-slate-400 font-black tracking-widest">{u.mobile || 'N/A'}</p>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <div className="flex flex-wrap gap-2 max-w-xs">
                    {u.skillsInterested?.slice(0, 3).map(s => (
                      <span key={s} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-10 py-8">
                  <div className="flex flex-col gap-1">
                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${u.isSuspended ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm'
                      }`}>
                      {u.isSuspended ? 'Suspended' : 'Verified'}
                    </span>
                    {u.suspensionRequest?.status === 'pending' && (
                      <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest italic ml-1 flex items-center gap-1">
                        <Clock size={8} /> Request Pending
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onToggleStatus(u)}
                      className={`p-4 rounded-2xl transition-all shadow-lg ${u.isSuspended
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-emerald-100'
                        : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white shadow-orange-100'
                        }`}
                      title={u.isSuspended ? "Restore Access" : "Suspend Account"}
                    >
                      {u.isSuspended ? <CheckCircle size={20} /> : <Minus size={20} />}
                    </button>
                    <button
                      onClick={() => onDelete(u._id)}
                      className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-100"
                      title="Delete Permanent"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

/* ==================================================
   5. HIRER DATA MANAGEMENT
   ================================================== */
const HirerDataManagement = ({ data, onToggleStatus, onDelete, onApprove, onReject }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const safeData = Array.isArray(data) ? data : [];
  const totalPages = Math.ceil(safeData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = safeData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Hirer Network</h2>
        <p className="text-slate-500 font-medium">Coordinate with corporate and industrial partners.</p>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            <tr>
              <th className="px-10 py-8">Enterprise</th>
              <th className="px-10 py-8">Contact Identity</th>
              <th className="px-10 py-8">Verification State</th>
              <th className="px-10 py-8">Documents</th>
              <th className="px-10 py-8 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Array.isArray(currentData) && currentData.map(h => (
              <tr key={h._id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-400 font-black group-hover:bg-blue-600 group-hover:text-white transition-all"><Briefcase size={20} /></div>
                    <span className="font-black text-slate-900 uppercase tracking-tighter text-lg">{h.companyDetails?.companyName || 'Corporate Entity'}</span>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{h.email}</p>
                    <p className="text-[10px] text-slate-400 font-black tracking-widest italic">{h.name}</p>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <div className="flex flex-col gap-1">
                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${h.isSuspended ? 'bg-red-50 text-red-600 border-red-100' :
                      !h.isAdminApproved ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                      {h.isSuspended ? 'Blocked' : !h.isAdminApproved ? 'Pending Approval' : 'Authorized Partner'}
                    </span>
                    {!h.isAdminApproved && (
                      <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest italic ml-1 flex items-center gap-1">
                        <Clock size={8} /> Needs Review
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-10 py-8">
                  {h.companyDetails?.companyDocument ? (
                    <a
                      href={`${API_BASE_URL}${h.companyDetails.companyDocument}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <FileText size={14} /> Download Doc
                    </a>
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No Document</span>
                  )}
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {!h.isAdminApproved ? (
                      <>
                        <button
                          onClick={() => onApprove(h._id)}
                          className="p-4 bg-white border border-emerald-100 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50 group/btn"
                          title="Accept Hirer"
                        >
                          <Check size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => onReject(h._id)}
                          className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-100"
                          title="Reject Hirer"
                        >
                          <X size={20} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(h)}
                        className={`p-4 rounded-2xl transition-all shadow-lg ${h.isSuspended
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-emerald-100'
                          : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white shadow-orange-100'
                          }`}
                        title={h.isSuspended ? "Restore Access" : "Suspend Account"}
                      >
                        {h.isSuspended ? <CheckCircle size={20} /> : <Minus size={20} />}
                      </button>
                    )}
                    <button onClick={() => onDelete(h._id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-100" title="Delete Permanent">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

/* ==================================================
   6. QUIZ MANAGEMENT
   ================================================== */
const QuizManagement = ({ courses, onGenQuiz, refresh }) => {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'create', 'generating', 'review'
  
  const [formData, setFormData] = useState({
    title: '', courseId: '', module: '', transcript: '', numQuestions: '50',
    difficulty: 'Medium', passingPercentage: '80', duration: '60',
    generateCertificate: true, language: 'English'
  });

  const [progressStep, setProgressStep] = useState(0);
  const [progressText, setProgressText] = useState('Initializing AI...');
  const steps = [
    'Fetching Transcript...', 'Analyzing Video...', 'Identifying Concepts...',
    'Generating Questions...', 'Validating Questions...', 'Saving Assessment...', 'Complete'
  ];

  const [questions, setQuestions] = useState([]);
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    // initialize from courses for published assessments
    const existingAssessments = courses.filter(c => c.quiz?.length > 0).map(c => ({
        id: c._id,
        title: `${c.title} Final Assessment`,
        courseTitle: c.title,
        status: 'Published',
        questionsCount: c.quiz?.length || 50,
        fullQuestions: c.quiz || [],
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    setAssessments(existingAssessments);
  }, [courses]);

  const handleGenerate = async () => {
    if (!formData.title || !formData.transcript || formData.transcript.trim() === '') {
      toast.error('Please provide transcript content before generating assessment.');
      return;
    }
    setView('generating');
    setProgressStep(0);
    setProgressText('Analyzing Transcript...');
    
    try {
      // Simulate underlying progress bar advancing slowly
      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < steps.length - 2) {
          currentStep++;
          setProgressStep(currentStep);
        }
      }, 5000);

      const response = await fetch(`${API_URL}/courses/generate-ai-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: formData.transcript,
          numQuestions: formData.numQuestions,
          difficulty: formData.difficulty,
          language: formData.language
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let finalQuestions = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                clearInterval(progressInterval);
                toast.error(data.error);
                setView('create');
                return;
              }
              if (data.progress) {
                setProgressText(data.progress);
              }
              if (data.result) {
                finalQuestions = data.result;
              }
            } catch (e) {
              console.error('Error parsing SSE data', e);
            }
          }
        }
      }
      
      clearInterval(progressInterval);
      setProgressStep(steps.length - 1);
      setProgressText('Assessment Ready');
      
      setTimeout(() => {
        const qsWithIds = (finalQuestions || []).map((q, i) => ({
          ...q,
          id: Date.now() + i
        }));
        setQuestions(qsWithIds);
        setView('review');
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error('AI generation temporarily unavailable. Please try again later.');
      setView('create');
    }
  };

  const handlePublish = async () => {
    if (!formData.courseId) {
      toast.error('Please select a course to attach this assessment to.');
      return;
    }
    try {
      await axios.put(`${API_URL}/courses/${formData.courseId}`, { quiz: questions });
      toast.success('Assessment Published Successfully!');
      if (refresh) await refresh();
      setView('dashboard');
      setFormData({
        title: '', courseId: '', module: '', transcript: '', numQuestions: '50',
        difficulty: 'Medium', passingPercentage: '80', duration: '60',
        generateCertificate: true, language: 'English'
      });
    } catch (e) {
      toast.error('Failed to publish assessment. Please try again.');
    }
  };

  const handleDeleteAssessment = async (id) => {
    try {
      await axios.put(`${API_URL}/courses/${id}`, { quiz: [] });
      toast.success('Assessment Deleted Successfully');
      if (refresh) await refresh();
    } catch (e) {
      toast.error('Failed to delete assessment');
    }
  };

  const handleEditAssessment = (assessment) => {
    setQuestions(assessment.fullQuestions || []);
    setFormData({
      ...formData,
      title: assessment.title.replace(' Final Assessment', ''),
      courseId: courses.find(c => c.title === assessment.courseTitle)?._id || ''
    });
    setView('review');
  };

  const renderDashboard = () => (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">AI Assessment Engine</h2>
          <p className="text-slate-500 font-medium">Dynamic generation of learning validations.</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-tighter text-sm hover:bg-primary transition-all flex items-center gap-3 shadow-xl"
        >
          <Plus size={20} /> Create AI Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Published Assessments', value: assessments.filter(a=>a.status==='Published').length, icon: CheckCircle, color: 'emerald' },
          { label: 'Draft Assessments', value: assessments.filter(a=>a.status==='Draft').length, icon: FileText, color: 'slate' },
          { label: 'Total Questions Gen', value: assessments.reduce((acc, curr) => acc + curr.questions, 0), icon: MessageSquare, color: 'blue' },
          { label: 'Avg Accuracy', value: '94%', icon: Activity, color: 'indigo' }
        ].map((s, i) => (
          <div key={i} className={`bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4 ${s.color === 'emerald' ? 'border-emerald-100' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl bg-${s.color}-50 flex items-center justify-center text-${s.color}-600`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{s.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 italic">Recent Assessments</h3>
        <div className="space-y-4">
          {assessments.map(a => (
            <div key={a.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px] border border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><Award size={20} /></div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter italic">{a.title}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {a.courseTitle} • {a.questionsCount || a.questions} Qs • {a.date} at {a.time || '10:00 AM'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${a.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>{a.status}</span>
                <button onClick={() => handleEditAssessment(a)} className="p-3 bg-white text-slate-900 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm"><Edit size={16}/></button>
                <button onClick={() => handleDeleteAssessment(a.id)} className="p-3 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {assessments.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-medium">No assessments found. Create one to get started.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="space-y-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => setView('dashboard')} className="p-4 bg-white rounded-full hover:bg-slate-100 transition-all text-slate-900 shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Create AI Assessment</h2>
          <p className="text-slate-500 font-medium">Configure parameters for automatic generation.</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-2xl space-y-8">
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Assessment Title</label>
          <input value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary" placeholder="e.g. Advanced Solar Installation Quiz" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Target Course</label>
            <select value={formData.courseId} onChange={e=>setFormData({...formData, courseId: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary">
              <option value="">Select Course...</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Specific Module (Optional)</label>
            <input value={formData.module} onChange={e=>setFormData({...formData, module: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary" placeholder="e.g. Module 3: Inverters" />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Transcript Input</label>
          <div className="relative">
            <FileText className="absolute left-4 top-6 text-slate-400" size={20} />
            <textarea 
              value={formData.transcript} 
              onChange={e=>setFormData({...formData, transcript: e.target.value})} 
              className="w-full pl-12 pr-4 py-4 min-h-[200px] bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary resize-y" 
              placeholder="Paste Transcript Here... (Extract from video, PDF, or course notes)" 
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Question Count</label>
            <input type="number" value={formData.numQuestions} onChange={e=>setFormData({...formData, numQuestions: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary" />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Difficulty</label>
            <select value={formData.difficulty} onChange={e=>setFormData({...formData, difficulty: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary">
              <option>Beginner</option>
              <option>Medium</option>
              <option>Advanced</option>
              <option>Mixed</option>
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Language</label>
            <select value={formData.language} onChange={e=>setFormData({...formData, language: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary">
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Passing Percentage (%)</label>
            <input type="number" value={formData.passingPercentage} onChange={e=>setFormData({...formData, passingPercentage: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary" />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Duration (Minutes)</label>
            <input type="number" value={formData.duration} onChange={e=>setFormData({...formData, duration: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <input type="checkbox" checked={formData.generateCertificate} onChange={e=>setFormData({...formData, generateCertificate: e.target.checked})} className="w-5 h-5 accent-primary" id="cert" />
          <label htmlFor="cert" className="font-bold text-slate-900 cursor-pointer">Issue Certificate upon passing</label>
        </div>

        <button onClick={handleGenerate} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-tighter text-lg hover:bg-primary transition-all flex items-center justify-center gap-3 shadow-xl">
          <Zap size={24} /> Generate Assessment Intelligence
        </button>
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-primary rounded-full border-t-transparent animate-spin"></div>
        <Zap size={64} className="text-primary animate-pulse" />
      </div>
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">AI Nexus Processing</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">{progressText}</p>
      </div>
      <div className="w-full max-w-md h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div className="h-full bg-primary transition-all duration-500" style={{width: `${(progressStep / (steps.length - 1)) * 100}%`}}></div>
      </div>
      <div className="flex gap-2">
        {steps.map((s, i) => (
           <div key={i} className={`w-3 h-3 rounded-full ${i < progressStep ? 'bg-primary' : i === progressStep ? 'bg-primary animate-ping' : 'bg-slate-200'}`}></div>
        ))}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-10">
      <div className="flex justify-between items-end bg-slate-900 p-10 rounded-[48px] text-white">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">Review & Refine</h2>
          <p className="text-slate-400 font-medium">Verify AI-generated questions before deployment.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setView('dashboard')} className="px-8 py-4 bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all">
            Save as Draft
          </button>
          <button onClick={handlePublish} className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2">
            <Check size={16} /> Publish Assessment
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{questions.length} Generated Questions</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-slate-200 flex items-center gap-2"><Plus size={14}/> Add Question</button>
          <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-slate-200 flex items-center gap-2"><Activity size={14}/> Regenerate All</button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative group">
            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all"><Edit size={16}/></button>
              <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all" title="Regenerate"><Activity size={16}/></button>
              <button onClick={() => setQuestions(questions.filter(qu => qu.id !== q.id))} className="p-2 bg-slate-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">{index + 1}</div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest">{q.difficulty || 'Medium'}</span>
            </div>
            
            <h4 className="text-lg font-bold text-slate-900 mb-6">{q.question || q.questionText || q.text || "Question text unavailable"}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt, i) => {
                const isCorrect = Number(i) === Number(q.correctAnswer) || opt === q.correctAnswer;
                return (
                  <div key={i} className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 hover:border-slate-300'}`}>
                     <span className="font-medium text-sm">{opt}</span>
                     {isCorrect && <CheckCircle size={18} className="text-emerald-500" />}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">AI Explanation</p>
              <p className="text-sm text-blue-900 font-medium">{q.explanation || "No explanation provided."}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {view === 'dashboard' && renderDashboard()}
        {view === 'create' && renderCreate()}
        {view === 'generating' && renderGenerating()}
        {view === 'review' && renderReview()}
      </motion.div>
    </AnimatePresence>
  );
};

/* ==================================================
   9. ADMIN PROFILE (REPLACED SETTINGS)
   ================================================== */
const AdminProfile = ({ currentUser, refreshUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    mobile: currentUser?.mobile || '',
    age: currentUser?.age || '',
    education: currentUser?.education || '',
    skillsInterested: currentUser?.skillsInterested?.join(', ') || '',
    currentWork: currentUser?.currentWork || '',
    careerGoal: currentUser?.careerGoal || '',
    preferredLanguage: currentUser?.preferredLanguage || '',
    password: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (selectedFile) {
      data.append('profilePicture', selectedFile);
    }

    // Strict Email Validation
    const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      return toast.error('Email must be in small letters and end with @gmail.com');
    }

    try {
      const res = await axios.put(`${API_URL}/auth/profile/${currentUser._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile Updated Successfully');
      setIsEditing(false);
      refreshUser();
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-5xl font-bold text-slate-900 uppercase tracking-tighter">Identity Profile</h2>
        <p className="text-slate-500 font-medium">Manage your administrative identity and digital presence.</p>
      </div>

      <div className="max-w-4xl bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl">
        {!isEditing ? (
          <div className="space-y-12">
            <div className="flex items-center gap-10">
              <div className="relative group">
                <div className="w-32 h-32 bg-slate-900 rounded-[40px] flex items-center justify-center text-white text-5xl font-black uppercase italic overflow-hidden border-4 border-white shadow-xl">
                  {currentUser?.profilePicture ? (
                    <img src={`${API_BASE_URL}${currentUser.profilePicture}`} className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.[0]
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-lg">
                  <Shield size={20} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                  {currentUser?.name}
                </h3>
                <p className="text-primary font-bold uppercase tracking-widest text-xs mt-3 flex items-center gap-2 italic">
                  <CheckCircle size={14} /> Master Admin Authorized
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10"
                >
                  <Edit size={14} /> Edit Identity Details
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-slate-50">
              {[
                { label: 'Primary Email', value: currentUser?.email, isEmail: true },
                { label: 'Contact Mobile', value: currentUser?.mobile || 'Not Connected' },
                { label: 'Age', value: currentUser?.age || 'N/A' },
                { label: 'Education', value: currentUser?.education || 'N/A' },
                { label: 'Skills Interested', value: currentUser?.skillsInterested?.join(', ') || 'None' },
                { label: 'Current Occupation', value: currentUser?.currentWork || 'N/A' },
                { label: 'Career Goal', value: currentUser?.careerGoal || 'N/A' },
                { label: 'Preferred Language', value: currentUser?.preferredLanguage || 'English' }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                  <p className={`text-base font-semibold text-slate-900 ${item.isEmail ? 'lowercase' : ''}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div
                onClick={() => fileInputRef.current.click()}
                className="w-32 h-32 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden group relative"
              >
                {previewUrl || currentUser?.profilePicture ? (
                  <img src={previewUrl || `${API_BASE_URL}${currentUser.profilePicture}`} className="w-full h-full object-cover" />
                ) : (
                  <Upload className="text-slate-300" size={32} />
                )}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <ImageIcon className="text-white" size={24} />
                </div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-500 font-medium italic">Update your avatar or branding assets. Recommended: 512x512px.</p>
                <button type="button" onClick={() => fileInputRef.current.click()} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Change Photo</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: 'name', label: 'Full Legal Name', placeholder: 'Your Name' },
                { name: 'email', label: 'Email Address', placeholder: 'email@example.com' },
                { name: 'mobile', label: 'Mobile Identification', placeholder: '+91 XXXXX XXXXX' },
                { name: 'age', label: 'Age', placeholder: '24' },
                { name: 'education', label: 'Education', placeholder: 'Graduate' },
                { name: 'skillsInterested', label: 'Skills Interested', placeholder: 'Solar, Tech, Agri' },
                { name: 'currentWork', label: 'Current Occupation', placeholder: 'Student / Active' },
                { name: 'careerGoal', label: 'Career Goal', placeholder: 'Engineer / Lead' },
                { name: 'password', label: 'New Password (Optional)', placeholder: 'Leave blank to keep current' },
                { name: 'preferredLanguage', label: 'Language', isSelect: true, options: ['ENGLISH', 'HINDI', 'TELUGU', 'TAMIL'] }
              ].map((f) => (
                <div key={f.name} className={`space-y-2 ${f.name === 'skillsInterested' ? 'md:col-span-2' : ''}`}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                  {f.isSelect ? (
                    <select
                      name={f.name}
                      value={formData[f.name]}
                      onChange={handleInputChange}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-sm"
                    >
                      <option value="">SELECT LANG</option>
                      {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.name === 'password' ? 'password' : 'text'}
                      name={f.name}
                      value={formData[f.name]}
                      onChange={(e) => {
                        const val = f.name === 'email' ? e.target.value.toLowerCase() : e.target.value;
                        setFormData({ ...formData, [f.name]: val });
                      }}
                      placeholder={f.placeholder}
                      className={`w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-sm ${f.name === 'email' ? 'lowercase' : ''}`}
                      required={f.name === 'name' || f.name === 'email'}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-6">
              <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-tighter text-sm hover:bg-primary transition-all shadow-2xl flex items-center justify-center gap-3">
                <Check size={20} /> Commit Profile Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-10 py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black uppercase tracking-tighter text-sm hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const AdminApproval = ({ data = [], onApprove, onToggleStatus, onDelete }) => (
  <div className="space-y-10">
    <div className="space-y-1">
      <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Administrative Council</h2>
      <p className="text-slate-500 font-medium">Coordinate with system administrators and manage clearance levels.</p>
    </div>

    <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          <tr>
            <th className="px-12 py-8">Identity Chain</th>
            <th className="px-12 py-8">Approval State</th>
            <th className="px-12 py-8 text-right">Operations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {Array.isArray(data) && data.map((item) => (
            <tr key={item._id} className="hover:bg-slate-50/50 transition-all group">
              <td className="px-12 py-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform"><Shield size={20} /></div>
                  <div>
                    <p className="font-black text-slate-900 uppercase tracking-tighter text-xl leading-none">{item.name}</p>
                    <p className="text-xs text-slate-400 italic font-mono mt-1">{item.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-12 py-10">
                <div className="flex flex-col gap-1">
                  <span className={`px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${item.isSuspended ? 'bg-red-50 text-red-600 border-red-100' :
                    !item.isAdminApproved ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                    {item.isSuspended ? 'Suspended' : !item.isAdminApproved ? 'Awaiting Clearance' : 'Authorized Partner'}
                  </span>
                </div>
              </td>
              <td className="px-12 py-10 text-right">
                <div className="flex items-center justify-end gap-3">
                  {item.email === 'nallamilliramacharanreddy@gmail.com' ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg italic">
                      <Lock size={12} className="text-primary" /> Root Administrator
                    </div>
                  ) : (
                    <>
                      {!item.isAdminApproved ? (
                        <button
                          onClick={() => onApprove(item._id)}
                          className="p-4 bg-white border border-emerald-100 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50 group/btn"
                          title="Grant Access"
                        >
                          <Check size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleStatus(item)}
                          className={`p-4 rounded-2xl transition-all shadow-lg ${item.isSuspended
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-emerald-100'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white shadow-orange-100'
                            }`}
                          title={item.isSuspended ? "Restore Access" : "Suspend Account"}
                        >
                          {item.isSuspended ? <CheckCircle size={20} /> : <Minus size={20} />}
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(item._id)}
                        className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-100"
                        title="Delete Permanent"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminDashboard;

