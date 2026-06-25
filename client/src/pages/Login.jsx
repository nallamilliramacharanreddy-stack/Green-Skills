import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Mail, Lock, LogIn, Users, Briefcase, Building,
  Target, BookOpen, ArrowRight,
  Leaf, Zap, Globe, Cpu, ShieldCheck, Clock,
  Eye, EyeOff, Key
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../utils/api';

const Login = () => {
  const { login, verifyOtp, verifyFaceLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordStage, setForgotPasswordStage] = useState(0); // 0: None, 1: Email, 2: OTP, 3: New Password
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(180);
  const [resetOtp, setResetOtp] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Face Verification completely disabled

  useEffect(() => {
    let timer;
    if (isOtpMode && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpMode, countdown]);

  const handleResendOtp = async () => {
    setOtp('');
    setCountdown(180);
    const res = await login(email, password, role);
    if (res.success && res.requiresOtp) {
      toast.success('A new OTP has been sent to your email.');
    } else {
      toast.error(res.message || 'Failed to resend OTP.');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (forgotPasswordStage === 1) {
      try {
        const res = await axios.post(`${API_URL}/auth/forgot-password-request`, { email });
        toast.success(res.data.message || 'OTP sent to your registered email address.');
        setForgotPasswordStage(2);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send OTP');
      }
    } else if (forgotPasswordStage === 2) {
      try {
        const res = await axios.post(`${API_URL}/auth/verify-reset-otp`, { email, otp: resetOtp });
        toast.success(res.data.message);
        setForgotPasswordStage(3);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Invalid or expired OTP');
      }
    } else if (forgotPasswordStage === 3) {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      try {
        const res = await axios.post(`${API_URL}/auth/reset-password`, { email, otp: resetOtp, newPassword: password });
        toast.success(res.data.message);
        setForgotPasswordStage(0);
        setPassword('');
        setConfirmPassword('');
        setResetOtp('');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      }
    }
  };

  // 3D Parallax Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const roles = [
    { id: 'student', title: 'USER', icon: Users, color: '#10B981' }, // Emerald
    { id: 'employer', title: 'HIRING TEAM', icon: Building, color: '#3B82F6' }, // Blue
    { id: 'admin', title: 'Admin', icon: ShieldCheck, color: '#EF4444' }, // Red
  ];

  const [suspendedInfo, setSuspendedInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuspendedInfo(null);

    if (isOtpMode) {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        toast.success('Admin Protocol Verified');
        navigate('/admin');
      } else {
        toast.error(res.message || 'OTP Verification Failed');
      }
      return;
    }

    const res = await login(email, password, role);
    if (res.success) {
      if (res.requiresOtp) {
        setIsOtpMode(true);
        setCountdown(180);
        toast.success(res.message || 'OTP sent to your email');
        return;
      }

      // Face authentication completely disabled

      toast.success('SIGNIN SUCCESSFUL');
      const savedUser = JSON.parse(sessionStorage.getItem('user'));
      if (savedUser.role === 'admin') {
        navigate('/admin');
      } else if (savedUser.role === 'employer') {
        navigate('/employer');
      } else {
        navigate('/dashboard');
      }
    } else {
      if (res.isSuspended) {
        setSuspendedInfo({
          email,
          status: res.requestStatus || 'none',
          message: res.message
        });
        toast.error('ACCESS DENIED: ACCOUNT SUSPENDED');
      } else {
        toast.error(res.message || 'Authentication Failure');
      }
    }
  };

  const handleRequestReactivation = async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/request-reactivation`, { email: suspendedInfo.email });
      setSuspendedInfo({ ...suspendedInfo, status: 'pending' });
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <div className="min-h-screen bg-white flex justify-center items-start lg:items-center p-6 pt-24 relative font-sans cursor-default w-full" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

        {/* Cinematic 3D Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-50 via-white to-blue-50 opacity-80"></div>

          {/* Floating 3D Orbs */}
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] mix-blend-multiply"
          ></motion.div>
          <motion.div
            animate={{ y: [0, 30, 0], x: [0, -20, 0], scale: [1.2, 1, 1.2] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-multiply"
          ></motion.div>
        </div>

        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">

          {/* Left Side: Info */}
          <div className="flex-1 hidden lg:block">
            <div className="relative">
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-7xl font-black text-slate-900 leading-tight"
                >
                  THE <span className="text-primary underline decoration-primary/20 underline-offset-8">FUTURE</span> <br />
                  OF RURAL <br />
                  SKILLS.
                </motion.h1>
                <p className="text-slate-500 text-xl font-medium max-w-md">
                  Experience the world's first cinematic empowerment platform. Powered by AI, built for the community.
                </p>
              </div>

              {/* God-Tier Extraordinary Role Modes */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl relative">
                {roles.map((r, i) => (
                  <motion.div
                    key={r.id}
                    onClick={() => {
                      if (r.id === 'employer') {
                        navigate('/hirer/login');
                      } else {
                        setRole(r.id);
                      }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative p-6 rounded-[32px] border-2 cursor-pointer transition-all duration-500 overflow-hidden group bg-white"
                    style={{
                      borderColor: role === r.id ? r.color : '#F1F5F9',
                      boxShadow: role === r.id ? `0 20px 40px ${r.color}20` : 'none'
                    }}
                  >
                    {/* Background Pattern/Texture */}
                    <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${role === r.id ? 'opacity-[0.08]' : ''
                      }`}>
                      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '12px 12px' }}></div>
                    </div>

                    {/* Active Indicator: Corner Color Accent */}
                    {role === r.id && (
                      <motion.div
                        layoutId="bento-accent"
                        className={`absolute top-0 right-0 w-12 h-12 rounded-bl-[32px] ${r.color === 'emerald' ? 'bg-emerald-500/10' :
                          r.color === 'blue' ? 'bg-blue-500/10' :
                            r.color === 'purple' ? 'bg-purple-500/10' :
                              r.color === 'orange' ? 'bg-orange-500/10' :
                                'bg-red-500/10'
                          }`}
                      />
                    )}

                    <div className="relative z-10 flex flex-col gap-4">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm"
                        style={{
                          backgroundColor: role === r.id ? r.color : '#FFFFFF',
                          color: role === r.id ? '#FFFFFF' : '#94A3B8'
                        }}
                      >
                        <r.icon size={20} strokeWidth={2.5} />
                      </div>

                      <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] block transition-colors ${role === r.id ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                          {r.title}
                        </span>
                      </div>
                    </div>

                    {/* Liquid Glow (Active) */}
                    {role === r.id && (
                      <div className={`absolute -bottom-12 -right-12 w-24 h-24 rounded-full blur-2xl ${r.color === 'emerald' ? 'bg-emerald-500/20' :
                        r.color === 'blue' ? 'bg-blue-500/20' :
                          r.color === 'purple' ? 'bg-purple-500/20' :
                            r.color === 'orange' ? 'bg-orange-500/20' :
                              'bg-red-500/20'
                        }`}></div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: The Nexus Card with Traveling Light */}
          <div className="w-full max-w-md relative">
            {/* Traveling Multi-Color Border Light */}
            <div className="absolute inset-0 p-[2px] rounded-[42px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 via-purple-500 via-orange-500 to-red-500 w-[300%] animate-border-travel shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
            </div>

            <div className="relative group p-[2px] rounded-[40px] bg-slate-100 overflow-hidden shadow-2xl">
              <div className="bg-white/90 backdrop-blur-3xl p-10 rounded-[38px] relative overflow-hidden border border-slate-200">

                {/* Internal Glows */}
                <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{isOtpMode ? 'ADMIN VERIFICATION' : forgotPasswordStage > 0 ? 'RESET PASSWORD' : 'LOGIN AS'}</h2>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors shadow-inner">
                      <Cpu className="text-primary animate-pulse" />
                    </div>
                  </div>

                  <form onSubmit={forgotPasswordStage > 0 ? handleForgotPasswordSubmit : handleSubmit} className="space-y-8">
                    {isOtpMode ? (
                      <div className="space-y-2 group/input animate-fade-in">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Security OTP</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/input:text-primary transition-colors" size={18} />
                          <input
                            type="text"
                            autoComplete="off"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-xl tracking-[0.5em] text-center placeholder:text-slate-400 placeholder:tracking-normal"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            required
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 mt-4">
                          <p className="text-[10px] text-slate-500 text-center">Please check your email for the security code.</p>
                          {countdown > 0 ? (
                            <p className="text-[11px] font-black text-slate-900 tracking-widest">
                              EXPIRES IN: <span className="text-primary">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                            </p>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <p className="text-[11px] font-black text-red-500 tracking-widest animate-pulse">TIME EXPIRED</p>
                              <button
                                type="button"
                                onClick={handleResendOtp}
                                className="text-[10px] font-black text-primary hover:text-emerald-600 underline tracking-widest transition-colors"
                              >
                                RESEND OTP
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : forgotPasswordStage > 0 ? (
                      <>
                        {forgotPasswordStage === 1 && (
                          <div className="space-y-2 group/input">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Registered Email</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/input:text-primary transition-colors" size={18} />
                              <input
                                type="email"
                                autoComplete="off"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-sm placeholder:text-slate-400 lowercase"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                required
                              />
                            </div>
                          </div>
                        )}
                        {forgotPasswordStage === 2 && (
                          <div className="space-y-2 group/input animate-fade-in">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Reset OTP</label>
                            <div className="relative">
                              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/input:text-primary transition-colors" size={18} />
                              <input
                                type="text"
                                autoComplete="off"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-xl tracking-[0.5em] text-center placeholder:text-slate-400 placeholder:tracking-normal"
                                value={resetOtp}
                                onChange={(e) => setResetOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                required
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 text-center mt-4">Check your email for the reset code.</p>
                          </div>
                        )}
                        {forgotPasswordStage === 3 && (
                          <>
                            <div className="space-y-2 group/input animate-fade-in">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">New Password</label>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors" size={18} />
                                <input
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="new-password"
                                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-sm placeholder:text-slate-400"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Enter New Password"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                >
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2 group/input animate-fade-in mt-4">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Confirm Password</label>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors" size={18} />
                                <input
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="new-password"
                                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-sm placeholder:text-slate-400"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="Confirm New Password"
                                  required
                                />
                              </div>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-center text-[10px] font-black text-gray-600 uppercase tracking-widest px-1 mt-6">
                          <button type="button" onClick={() => { setForgotPasswordStage(0); setPassword(''); setConfirmPassword(''); setResetOtp(''); }} className="hover:text-red-500 transition-colors">
                            Cancel Reset
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 group/input">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/input:text-primary transition-colors" size={18} />
                            <input
                              type="email"
                              autoComplete="off"
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-sm placeholder:text-slate-400 lowercase"
                              value={email}
                              onChange={(e) => setEmail(e.target.value.toLowerCase())}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2 group/input">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors" size={18} />
                            <input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-sm placeholder:text-slate-400"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">
                          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                            <input type="checkbox" className="w-3 h-3 rounded bg-white/5 border-white/10 text-primary focus:ring-0" />
                            Stay Connected
                          </label>
                          <button type="button" onClick={() => setForgotPasswordStage(1)} className="hover:text-primary transition-colors">
                            Forgot Password?
                          </button>
                        </div>
                      </>
                    )}

                    {suspendedInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-6 bg-red-50 rounded-[32px] border border-red-100 space-y-4"
                      >
                        <div className="flex items-center gap-3 text-red-600">
                          <Target size={20} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">SECURITY PROTOCOL: ACCOUNT SUSPENDED</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          Your identity chain has been isolated. Contact the Admin Nexus or request a manual synchronization to regain access.
                        </p>
                        {suspendedInfo.status === 'pending' ? (
                          <div className="py-3 px-4 bg-amber-50 text-amber-600 rounded-2xl flex items-center gap-2 border border-amber-100">
                            <Clock size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">Sync Request Pending...</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRequestReactivation}
                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                          >
                            Request Re-activation
                          </button>
                        )}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isOtpMode && countdown === 0}
                      className={`w-full py-5 text-white rounded-full font-black text-lg transition-all flex items-center justify-center gap-4 uppercase tracking-tighter shadow-2xl group ${isOtpMode && countdown === 0
                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-slate-900 hover:bg-primary shadow-slate-900/20'
                        }`}
                    >
                      {isOtpMode ? 'VERIFY OTP' : forgotPasswordStage === 1 ? 'SEND OTP' : forgotPasswordStage === 2 ? 'VERIFY OTP' : forgotPasswordStage === 3 ? 'CONFIRM NEW PASSWORD' : 'LOGIN'}
                      <ArrowRight size={20} className={`transition-transform ${isOtpMode && countdown === 0 ? '' : 'group-hover:translate-x-1'}`} />
                    </button>
                  </form>

                  <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      Not have any account? <Link to="/signup" className="text-slate-900 hover:text-primary underline decoration-2 underline-offset-4 transition-colors ml-1">Register here</Link>
                    </p>
                    <Link to="/hirer/login" className="text-primary text-[9px] font-black uppercase tracking-[0.2em] hover:text-emerald transition-all italic mt-4">Are you a Hirer? Go to Hirer Portal</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes border-travel {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-border-travel {
          animation: border-travel 2s linear infinite;
        }
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-text-shimmer {
          background-size: 200% auto;
          animation: text-shimmer 3s linear infinite;
        }
        @keyframes scanner {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scanner {
          animation: scanner 2s ease-in-out infinite;
        }
      `}} />

      {/* Face Authentication Modal removed */}
    </div>
  );
};

export default Login;
