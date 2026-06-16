import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { RealTimeProvider } from './context/RealTimeContext';
import { StreakProvider } from './context/StreakContext';

import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

import Login from './pages/Login';
import Signup from './pages/Signup';
import HirerLogin from './pages/HirerLogin';
import HirerSignup from './pages/HirerSignup';
const StudentDashboard = React.lazy(() => import('./pages/Dashboard/StudentDashboard'));
const Courses = React.lazy(() => import('./pages/Dashboard/Courses'));
const Hiring = React.lazy(() => import('./pages/Dashboard/Hiring'));
const Quiz = React.lazy(() => import('./pages/Dashboard/Quiz'));
const AdminDashboard = React.lazy(() => import('./pages/Dashboard/AdminDashboard'));
const AIChat = React.lazy(() => import('./pages/Dashboard/AIChat'));
const MyJourney = React.lazy(() => import('./pages/Dashboard/MyJourney'));
const Streaks = React.lazy(() => import('./pages/Dashboard/Streaks'));
const Certificates = React.lazy(() => import('./pages/Dashboard/Certificates'));
const LeaderboardPage = React.lazy(() => import('./pages/Dashboard/LeaderboardPage'));
const ProfilePage = React.lazy(() => import('./pages/Dashboard/ProfilePage'));
const GuideDashboard = React.lazy(() => import('./pages/Dashboard/GuideDashboard'));
const EmployerDashboard = React.lazy(() => import('./pages/Dashboard/EmployerDashboard'));
const SupportDashboard = React.lazy(() => import('./pages/Dashboard/SupportDashboard'));
const SuperAdmin = React.lazy(() => import('./pages/Dashboard/SuperAdmin'));
const PremiumEcosystem = React.lazy(() => import('./pages/Premium/PremiumEcosystem'));

import { ProtectedRoute, PublicRoute } from './components/auth/AuthRoutes';
import Navbar from './components/layout/Navbar';
import FloatingAI from './components/layout/FloatingAI';

import LeaderboardHub from './components/leaderboard/LeaderboardHub';
import StreakHubFAB from './components/streak/StreakHubFAB';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <RealTimeProvider>
          <StreakProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-white">
          <Navbar />
          <Toaster position="top-right" />
          <React.Suspense fallback={
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-bold text-gray-500 tracking-widest uppercase">Loading Modules...</p>
            </div>
          }>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/hirer/login" element={<PublicRoute><HirerLogin /></PublicRoute>} />
            <Route path="/hirer/signup" element={<PublicRoute><HirerSignup /></PublicRoute>} />
            
            {/* Protected Student Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/dashboard/hiring" element={<ProtectedRoute><Hiring /></ProtectedRoute>} />
            <Route path="/dashboard/quiz" element={<ProtectedRoute allowedRoles={['student']}><Quiz /></ProtectedRoute>} />
            <Route path="/dashboard/ai" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            <Route path="/dashboard/journey" element={<ProtectedRoute><MyJourney /></ProtectedRoute>} />
            <Route path="/dashboard/streaks" element={<ProtectedRoute><Streaks /></ProtectedRoute>} />
            <Route path="/dashboard/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/dashboard/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/dashboard/premium" element={<ProtectedRoute allowedRoles={['student']}><PremiumEcosystem /></ProtectedRoute>} />
            
            {/* Protected Role-Based Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/leaderboard" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/hirers" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/quizzes" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/proctoring" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/admins" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/integrity" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin']}><ProfilePage /></ProtectedRoute>} />
            <Route path="/guide" element={<ProtectedRoute><GuideDashboard /></ProtectedRoute>} />
            <Route path="/guide/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/employer" element={<ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/jobs" element={<ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/exams" element={<ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/candidates" element={<ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/hired" element={<ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/applications" element={<ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/profile" element={<ProtectedRoute allowedRoles={['employer']}><ProfilePage /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><SupportDashboard /></ProtectedRoute>} />
            <Route path="/support/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin_course/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin_hiring/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin_exam/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['admin', 'super-admin']}><SuperAdmin /></ProtectedRoute>} />
            </Routes>
          </React.Suspense>

          <LeaderboardHub />
          <FloatingAI />
            </div>
          </Router>
          </StreakProvider>
        </RealTimeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
