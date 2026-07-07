import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  User, Users, ShieldCheck, Mail, Lock, Phone, 
  Building, Briefcase, Globe,
  ArrowRight, Cpu, Zap,
  Eye, EyeOff
} from 'lucide-react';

const HirerSignup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'employer',
    mobile: '', companyName: '', registrationNumber: '',
    currentWork: 'Recruiter', careerGoal: 'Hiring rural talent',
    preferredLanguage: 'ENGLISH'
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [companyDocument, setCompanyDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = React.useRef(null);
  const docInputRef = React.useRef(null);

  // 3D Parallax Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Document must be less than 1MB');
        e.target.value = null;
        return;
      }
      setCompanyDocument(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Strict Email Validation
    const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      return toast.error('Email must be in small letters and end with @gmail.com');
    }

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return toast.error('Password must contain uppercase, lowercase, number, and special character.');
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    if (profilePicture) {
      data.append('profilePicture', profilePicture);
    }
    if (companyDocument) {
      data.append('companyDocument', companyDocument);
    }

    const res = await signup(data);
    if (res.success) {
      if (res.needsApproval) {
        toast.success('Registration successful. Awaiting Admin approval.');
        navigate('/hirer/login');
      } else {
        toast.success('Company Portal Initialized');
        navigate('/employer');
      }
    } else {
      toast.error(res.message || 'Registration Failed');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <div className="min-h-screen bg-white flex justify-center items-start p-6 relative font-sans py-24 w-full" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        
        {/* Cinematic 3D Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-blue-50 via-white to-primary/5 opacity-80"></div>
          <motion.div 
            animate={{ y: [0, -50, 0], opacity: [0.1, 0.2, 0.1] }} 
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]"
          ></motion.div>
        </div>

        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-start justify-between gap-16 relative z-10">
          
          {/* Left Side: Info */}
          <div className="flex-1 lg:sticky lg:top-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    <Building size={28} />
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Company <span className="text-blue-600">Onboarding</span></h2>
                </div>
                <p className="text-slate-500 text-lg font-medium max-w-md">
                  Establish your presence in the GreenSkill Nexus. Register your company to start discovering top-tier rural talent.
                </p>
                <div className="flex items-center gap-3 text-slate-400">
                    <Zap size={16} className="text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Corporate Entity Initialization v1.0</p>
                </div>

                {/* Role Modes Matrix */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl relative">
                  {[
                    { id: 'student', title: 'USER', icon: Users, color: '#10B981' },
                    { id: 'employer', title: 'HIRING TEAM', icon: Building, color: '#3B82F6' },
                    { id: 'admin', title: 'Admin', icon: ShieldCheck, color: '#EF4444' },
                  ].map((r) => (
                    <motion.div
                      key={r.id}
                      onClick={() => {
                        if (r.id === 'student') navigate('/signup');
                        else if (r.id === 'admin') navigate('/signup');
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

          {/* Right Side: Registration Form Card */}
          <motion.div 
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-[1.8] w-full relative"
          >
            <div className="absolute inset-0 p-[2px] rounded-[42px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-primary via-emerald-500 to-blue-500 w-[300%] animate-border-travel shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
            </div>

            <div className="relative group p-[2px] rounded-[40px] bg-slate-100 overflow-hidden shadow-2xl">
              <div className="bg-white/95 backdrop-blur-3xl p-10 md:p-16 rounded-[38px] relative overflow-hidden border border-slate-200">
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter ">Register Company</h3>
                      <p className="text-slate-600 text-[10px] font-black tracking-[0.4em] uppercase">ENTITY REGISTRATION</p>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                      <Cpu className="text-blue-500 animate-pulse" />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center gap-4 mb-8">
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden group relative"
                      >
                        {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <User className="text-slate-300" size={32} />
                            <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Add Logo/Photo</span>
                          </div>
                        )}
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ">Corporate Identity Asset (Optional)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                      {[
                        { name: 'companyName', label: 'Company Name', icon: Building, placeholder: 'TECH SOLUTIONS LTD' },
                        { name: 'registrationNumber', label: 'Reg. Number / TAX ID', icon: Briefcase, placeholder: 'REG-123456' },
                        { name: 'name', label: 'HR/Recruiter Name', icon: User, placeholder: 'CONTACT PERSON' },
                        { name: 'email', label: 'Company Email', icon: Mail, placeholder: 'HIRING@COMPANY.COM' },
                        { name: 'password', label: 'Portal Password', icon: Lock, placeholder: '••••••••', type: 'password' },
                        { name: 'mobile', label: 'Contact Phone', icon: Phone, placeholder: '+91-CONTACT' },
                        { name: 'preferredLanguage', label: 'Preferred Language', icon: Globe, isSelect: true, options: ['ENGLISH', 'HINDI', 'TELUGU', 'TAMIL'] }
                      ].map((f) => (
                        <div key={f.name} className="space-y-2 group/input">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">{f.label}</label>
                          <div className="relative">
                            <f.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                            {f.isSelect ? (
                              <select
                                name={f.name}
                                value={formData[f.name]}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-blue-500/50 transition-all font-mono text-xs appearance-none"
                                required
                              >
                                {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <div className="relative">
                                <input
                                  type={f.type === 'password' ? (showPassword ? 'text' : 'password') : (f.type || 'text')}
                                  name={f.name}
                                  placeholder={f.placeholder}
                                  value={formData[f.name]}
                                  onChange={handleChange}
                                  className={`w-full pl-12 pr-${f.type === 'password' ? '12' : '4'} py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-blue-500/50 transition-all font-mono text-xs placeholder:text-slate-400`}
                                  required
                                />
                                {f.type === 'password' && (
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                                  >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Company Document Upload */}
                    <div className="mt-8 flex flex-col items-center gap-4">
                      <div 
                        onClick={() => docInputRef.current.click()}
                        className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden group relative"
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase className="text-slate-300 group-hover:text-blue-500 transition-colors" size={24} />
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                              {companyDocument ? companyDocument.name : 'Upload Official Document'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {companyDocument ? 'Document Selected' : 'Max 1MB (PDF, DOC, JPG)'}
                            </span>
                          </div>
                        </div>
                        <input 
                          ref={docInputRef}
                          type="file" 
                          className="hidden" 
                          onChange={handleDocChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl hover:bg-blue-600 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 uppercase tracking-tighter"
                      >
                        INITIALIZE PORTAL <ArrowRight size={24} />
                      </button>
                      <p className="text-center mt-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        Already registered? <Link to="/hirer/login" className="text-slate-900 hover:text-blue-600 underline transition-all underline-offset-4 font-bold">Hirer Login</Link>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes border-travel {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-border-travel {
            animation: border-travel 3s linear infinite;
          }
        `}} />
      </div>
    </div>
  );
};

export default HirerSignup;
