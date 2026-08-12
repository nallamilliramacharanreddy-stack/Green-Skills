import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, ArrowRight, Mail, Phone, MapPin, ShieldCheck, Award, 
  Sparkles, Globe, Heart, CheckCircle2, Send, 
  GraduationCap, Briefcase, Bot, FileBadge, HelpCircle, Users, BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Footer = ({ showCTA = true }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer id="contact" className="w-full relative bg-[#06180e] text-slate-200 pt-0 overflow-hidden font-sans">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {showCTA && (
        <div className="max-w-[1320px] mx-auto px-6 pt-12 pb-4 relative z-10">
          {/* SEAMLESS INTEGRATED CTA BANNER - CONNECTS DIRECTLY TO FOOTER WITH NO GAP */}
          <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-green-700 to-teal-900 shadow-2xl border border-emerald-500/30 p-8 md:p-12 text-center text-white">
            {/* Background Texture & Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-2xl"></div>

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold tracking-wider uppercase mb-4 text-emerald-100 shadow-sm">
                <Sparkles size={14} className="text-yellow-300 animate-pulse" /> Empowering Rural India
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white leading-tight">
                Ready to Build a Better, Greener Future?
              </h2>
              <p className="text-base md:text-lg text-emerald-100 mb-8 font-medium max-w-2xl leading-relaxed">
                Join thousands of rural youth gaining certified skills in solar energy, sustainable farming, and green tech. Transform your career today.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link 
                  to={user ? (user.role === 'admin' ? '/admin' : user.role === 'employer' ? '/employer' : '/dashboard') : '/signup'} 
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-emerald-950 rounded-2xl font-extrabold shadow-xl hover:bg-emerald-50 hover:scale-105 transition-all duration-300 text-sm md:text-base group"
                >
                  {user ? 'Go to Your Dashboard' : 'Start Learning Now'} 
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/courses" 
                  className="inline-flex items-center gap-2 px-7 py-4 bg-emerald-950/60 text-white rounded-2xl font-bold border border-emerald-400/40 hover:bg-emerald-900/80 transition-all duration-300 text-sm backdrop-blur-sm"
                >
                  <BookOpen size={18} /> Explore Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER MAIN BODY */}
      <div className="max-w-[1320px] mx-auto px-6 pt-10 pb-16 relative z-10">
        
        {/* Top Grid: Brand & 3 Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-14 border-b border-emerald-900/40">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50 group-hover:rotate-6 transition-transform">
                <Leaf className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white">GreenSkill <span className="text-emerald-400 font-semibold">Rural</span></span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">Digital Empowerment Ecosystem</span>
              </div>
            </Link>

            <p className="text-sm text-slate-300 leading-relaxed font-normal max-w-md">
              GreenSkill Rural is India’s premier digital learning platform empowering rural communities with high-demand renewable energy, eco-agriculture, and green tech capabilities paired with AI guidance and verified job placements.
            </p>

            {/* Impact Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/50 text-xs font-semibold text-emerald-300">
                <ShieldCheck size={16} className="text-emerald-400" /> Govt & Industry Aligned
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/50 text-xs font-semibold text-emerald-300">
                <Award size={16} className="text-emerald-400" /> Verified Certificates
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Connect With Our Community</span>
              <div className="flex items-center gap-3">
                {[
                  { name: 'FB', label: 'Facebook', href: '#' },
                  { name: 'TW', label: 'Twitter', href: '#' },
                  { name: 'IG', label: 'Instagram', href: '#' },
                  { name: 'IN', label: 'LinkedIn', href: '#' },
                  { name: 'YT', label: 'YouTube', href: '#' }
                ].map((s, idx) => (
                  <a 
                    key={idx} 
                    href={s.href} 
                    title={s.label}
                    className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-xs font-extrabold text-slate-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all duration-300 shadow-md hover:-translate-y-1"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Col 1: Learning Ecosystem */}
          <div className="space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <GraduationCap size={16} /> Learning & AI
            </h3>
            <ul className="space-y-3 text-sm font-medium text-slate-300">
              <li><Link to="/courses" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">Green Skill Courses</Link></li>
              <li><Link to="/ai-mentor" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">24/7 AI Mentor</Link></li>
              <li><Link to="/quiz" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">Practice & Quizzes</Link></li>
              <li><Link to="/certificates" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">Verify Certificate</Link></li>
              <li><Link to="/leaderboard" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">Student Leaderboard</Link></li>
              <li><Link to="/my-journey" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">Learning Pathway</Link></li>
            </ul>
          </div>

          {/* Col 2: Employment & Jobs */}
          <div className="space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Briefcase size={16} /> Jobs & Careers
            </h3>
            <ul className="space-y-3 text-sm font-medium text-slate-300">
              <li><Link to="/jobs" className="hover:text-emerald-400 transition-colors">Nearby Green Jobs</Link></li>
              <li><Link to="/hiring-exams" className="hover:text-emerald-400 transition-colors">Hiring Exams</Link></li>
              <li><Link to="/employer" className="hover:text-emerald-400 transition-colors">For Employers</Link></li>
              <li><Link to="/post-job" className="hover:text-emerald-400 transition-colors">Post an Opportunity</Link></li>
              <li><Link to="/talent" className="hover:text-emerald-400 transition-colors">Hire Rural Talent</Link></li>
            </ul>
          </div>

          {/* Col 3: Support & Contact Info */}
          <div className="space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <HelpCircle size={16} /> Support & Hub
            </h3>
            <ul className="space-y-3 text-sm font-medium text-slate-300">
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Our Mission</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
              <li><Link to="/faq" className="hover:text-emerald-400 transition-colors">FAQs & Guides</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* Middle Section: Newsletter & Contact Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-10 border-b border-emerald-900/40 items-center">
          
          {/* Newsletter Box */}
          <div className="lg:col-span-7 bg-emerald-950/60 border border-emerald-800/40 rounded-2xl p-6 md:p-8 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1 max-w-md">
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Mail className="text-emerald-400" size={18} /> Subscribe to Green Innovation News
                </h4>
                <p className="text-xs text-slate-400">
                  Get weekly alerts on free solar, agri-tech courses, job fairs, and skill workshops.
                </p>
              </div>

              {subscribed ? (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 size={16} className="text-emerald-400" /> Subscribed successfully!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex w-full md:w-auto bg-slate-900/90 rounded-xl p-1 border border-emerald-800/60 focus-within:border-emerald-500 transition-all">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address" 
                    required
                    className="bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 outline-none w-full md:w-56"
                  />
                  <button 
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md shrink-0"
                  >
                    Subscribe <Send size={12} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Direct Contact Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-emerald-950/40 border border-emerald-800/30 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-900/60 flex items-center justify-center text-emerald-400 shrink-0">
                <Mail size={18} />
              </div>
              <div className="text-xs space-y-0.5">
                <span className="text-slate-400 font-medium">Email Support</span>
                <p className="font-bold text-white tracking-wide truncate">support@greenskill.org</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-emerald-950/40 border border-emerald-800/30 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-900/60 flex items-center justify-center text-emerald-400 shrink-0">
                <Phone size={18} />
              </div>
              <div className="text-xs space-y-0.5">
                <span className="text-slate-400 font-medium">Rural Helpline</span>
                <p className="font-bold text-white tracking-wide">+91 1800-GREEN-SKILL</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-emerald-400" />
            <span>© 2026 GreenSkill Rural Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800/40 text-[11px] font-bold text-emerald-400">
              🌱 100% Carbon-Neutral Ecosystem
            </span>
            <span className="text-slate-400">
              Empowering India with <Heart size={12} className="inline text-emerald-400 fill-emerald-400 mx-0.5" /> for Sustainable Future
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
