import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Mail, Lock, ArrowRight, 
  Building, Cpu, Briefcase,
  Users, ShieldCheck,
  Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../utils/api';

const HirerLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email, newPassword: password });
      toast.success(res.data.message);
      setIsForgotPassword(false);
      setPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset identity key');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password, 'employer');
    if (res.success) {
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
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{isForgotPassword ? 'RESET PASSWORD' : 'HIRER LOGIN'}</h2>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors shadow-inner">
                      <Cpu className="text-primary animate-pulse" />
                    </div>
                  </div>

                  <form onSubmit={isForgotPassword ? handleForgotPasswordSubmit : handleSubmit} className="space-y-8">
                    <div className="space-y-2 group/input">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">{isForgotPassword ? 'Registered Email' : 'Company Email'}</label>
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">{isForgotPassword ? 'New Password' : 'Password'}</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder={isForgotPassword ? "Enter New Password" : "••••••••••••"} 
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
                      <button type="button" onClick={() => setIsForgotPassword(!isForgotPassword)} className="hover:text-primary transition-colors">
                        {isForgotPassword ? 'Back to Login' : 'Forgot Password?'}
                      </button>
                    </div>

                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-full font-black text-lg hover:bg-primary transition-all flex items-center justify-center gap-4 uppercase tracking-tighter shadow-2xl shadow-slate-900/20 group">
                      {isForgotPassword ? 'CONFIRM NEW PASSWORD' : 'ACCESS PORTAL'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
