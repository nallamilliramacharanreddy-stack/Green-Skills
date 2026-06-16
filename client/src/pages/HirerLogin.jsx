import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Mail, Lock, ArrowRight, 
  Building, Cpu, Briefcase,
  Users, ShieldCheck,
  Eye, EyeOff, Key
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../utils/api';

const HirerLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordStage, setForgotPasswordStage] = useState(0); // 0: None, 1: Email, 2: OTP, 3: New Password
  const [resetOtp, setResetOtp] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(180);

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

  React.useEffect(() => {
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
    const res = await login(email, password, 'employer');
    if (res.success && res.requiresOtp) {
      toast.success('A new OTP has been sent to your email.');
    } else {
      toast.error(res.message || 'Failed to resend OTP.');
    }
  };

  const { verifyOtp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOtpMode) {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        toast.success('Hiring Nexus Connected');
        navigate('/employer');
      } else {
        toast.error(res.message || 'OTP Verification Failed');
      }
      return;
    }

    const res = await login(email, password, 'employer');
    if (res.success) {
      if (res.requiresOtp) {
        setIsOtpMode(true);
        setCountdown(180);
        toast.success(res.message || 'OTP sent to your email');
        return;
      }
      toast.success('Hiring Nexus Connected');
      navigate('/employer');
    } else {
      toast.error(res.message || 'Authentication Failure');
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <div className="min-h-screen bg-white flex justify-center items-start lg:items-center p-6 pt-24 relative font-sans cursor-default w-full" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        
        {/* Cinematic 3D Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-primary/5 opacity-80"></div>
          <motion.div 
            animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }} 
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] mix-blend-multiply"
          ></motion.div>
          <motion.div 
            animate={{ y: [0, 30, 0], x: [0, -20, 0], scale: [1.2, 1, 1.2] }} 
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-multiply"
          ></motion.div>
        </div>

        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          
          {/* Left Side: Info */}
          <div className="flex-1 hidden lg:block">
            <div className="relative">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary mb-6">
                  <Briefcase size={40} className="animate-pulse" />
                  <span className="text-xl font-black tracking-widest uppercase">Hiring Portal</span>
                </div>
                <motion.h1 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-7xl font-black text-slate-900 leading-tight"
                >
                  RECRUIT <br />
                  <span className="text-primary underline decoration-primary/20 underline-offset-8">RURAL</span> <br />
                  TALENT.
                </motion.h1>
                <p className="text-slate-500 text-xl font-medium max-w-md">
                  Access the world's most talented rural professionals. Build your green workforce with AI-powered matching.
                </p>

                {/* Role Modes Matrix */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl relative">
                  {roles.map((r, i) => (
                    <motion.div
                      key={r.id}
                      onClick={() => {
                        if (r.id === 'student') navigate('/login');
                        else if (r.id === 'admin') navigate('/login'); // Standard login for admin
                      }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                        className="relative p-6 rounded-[32px] border-2 cursor-pointer transition-all duration-500 overflow-hidden group bg-white"
                        style={{ 
                          borderColor: r.id === 'employer' ? r.color : '#F1F5F9',
                          boxShadow: r.id === 'employer' ? `0 20px 40px ${r.color}20` : 'none'
                        }}
                    >
                      <div className="relative z-10 flex flex-col gap-4">
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm"
                          style={{ 
                            backgroundColor: r.id === 'employer' ? r.color : '#FFFFFF',
                            color: r.id === 'employer' ? '#FFFFFF' : '#94A3B8'
                          }}
                        >
                          <r.icon size={20} strokeWidth={2.5} />
                        </div>
                        
                        <div className="space-y-1">
                          <span className={`text-[10px] font-black uppercase tracking-[0.3em] block transition-colors ${
                            r.id === 'employer' ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                            {r.title}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: The Nexus Card */}
          <div className="w-full max-w-md relative">
            <div className="absolute inset-0 p-[2px] rounded-[42px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-primary to-emerald-500 w-[300%] animate-border-travel shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
            </div>
            
            <div className="relative group p-[2px] rounded-[40px] bg-slate-100 overflow-hidden shadow-2xl">
              <div className="bg-white/90 backdrop-blur-3xl p-10 rounded-[38px] relative overflow-hidden border border-slate-200">
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{forgotPasswordStage > 0 ? 'RESET PASSWORD' : 'HIRER LOGIN'}</h2>
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
                                placeholder="RECRUITER@COMPANY.CORE" 
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
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Company Email</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/input:text-primary transition-colors" size={18} />
                            <input 
                              type="email" 
                              placeholder="RECRUITER@COMPANY.CORE" 
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
                              placeholder="••••••••••••" 
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

                        <div className="flex items-center justify-between text-[10px] font-black text-gray-600 uppercase tracking-widest px-1 pb-4">
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

                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-full font-black text-lg hover:bg-primary transition-all flex items-center justify-center gap-4 uppercase tracking-tighter shadow-2xl shadow-slate-900/20 group">
                      {isOtpMode ? 'VERIFY OTP' : forgotPasswordStage === 1 ? 'SEND OTP' : forgotPasswordStage === 2 ? 'VERIFY OTP' : forgotPasswordStage === 3 ? 'CONFIRM NEW PASSWORD' : 'ACCESS PORTAL'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>

                  <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">
                      Need to recruit talent? <Link to="/hirer/signup" className="text-slate-900 hover:text-primary underline decoration-2 underline-offset-4 transition-colors ml-1">Register Company</Link>
                    </p>
                    <Link to="/login" className="text-slate-400 text-[9px] uppercase tracking-widest hover:text-primary transition-colors italic">Student Login?</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes border-travel {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-border-travel {
          animation: border-travel 2s linear infinite;
        }
      `}} />
    </div>
  );
};

export default HirerLogin;
