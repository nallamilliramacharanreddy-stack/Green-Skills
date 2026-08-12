import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, ArrowRight, Mail, Phone, ShieldCheck, Award, 
  Sparkles, Globe, Heart, CheckCircle2, Send, 
  GraduationCap, Briefcase, HelpCircle, BookOpen
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
    <footer id="contact" className="w-full relative bg-[#06180e] text-slate-200 overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/3 w-80 h-80 bg-green-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {showCTA && (
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 pt-6 pb-2 relative z-10">
          {/* SLEEK COMPACT INTEGRATED CTA BANNER */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-800 via-green-700 to-teal-900 shadow-xl border border-emerald-500/30 px-6 py-6 md:py-7 text-center text-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-2 text-emerald-100 shadow-sm">
                <Sparkles size={12} className="text-yellow-300 animate-pulse" /> Empowering Rural India
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mb-2 text-white leading-tight">
                Ready to Build a Better, Greener Future?
              </h2>
              <p className="text-xs md:text-sm text-emerald-100 mb-4 font-medium max-w-xl leading-relaxed">
                Join thousands of rural youth gaining certified skills in solar energy, sustainable farming, and green tech.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link 
                  to={user ? (user.role === 'admin' ? '/admin' : user.role === 'employer' ? '/employer' : '/dashboard') : '/signup'} 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-950 rounded-xl font-extrabold shadow-md hover:bg-emerald-50 transition-all text-xs group"
                >
                  {user ? 'Go to Dashboard' : 'Start Learning Now'} 
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link 
                  to="/courses" 
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-950/60 text-white rounded-xl font-semibold border border-emerald-400/40 hover:bg-emerald-900/80 transition-all text-xs backdrop-blur-sm"
                >
                  <BookOpen size={14} /> Explore Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER MAIN BODY */}
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 pt-6 pb-10 relative z-10">
        
        {/* Top Grid: Brand & 3 Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-emerald-900/40">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/50">
                <Leaf className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white">GreenSkill <span className="text-emerald-400 font-semibold">Rural</span></span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400/80">Digital Empowerment Ecosystem</span>
              </div>
            </Link>

            <p className="text-xs text-slate-300 leading-relaxed font-normal max-w-sm">
              Empowering rural communities with certified green tech capabilities, AI guidance, and direct job opportunities.
            </p>

            {/* Impact Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-[11px] font-semibold text-emerald-300">
                <ShieldCheck size={14} className="text-emerald-400" /> Govt & Industry Aligned
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-[11px] font-semibold text-emerald-300">
                <Award size={14} className="text-emerald-400" /> Verified Certificates
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 pt-1">
              {[
                { name: 'FB', href: '#' },
                { name: 'TW', href: '#' },
                { name: 'IG', href: '#' },
                { name: 'IN', href: '#' },
                { name: 'YT', href: '#' }
              ].map((s, idx) => (
                <a 
                  key={idx} 
                  href={s.href} 
                  className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-[10px] font-extrabold text-slate-300 hover:text-white hover:bg-emerald-600 transition-all shadow-sm"
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>

          {/* Col 1: Learning Ecosystem */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <GraduationCap size={14} /> Learning & AI
            </h3>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              <li><Link to="/courses" className="hover:text-emerald-400 transition-colors">Green Skill Courses</Link></li>
              <li><Link to="/ai-mentor" className="hover:text-emerald-400 transition-colors">24/7 AI Mentor</Link></li>
              <li><Link to="/quiz" className="hover:text-emerald-400 transition-colors">Practice & Quizzes</Link></li>
              <li><Link to="/certificates" className="hover:text-emerald-400 transition-colors">Verify Certificate</Link></li>
              <li><Link to="/leaderboard" className="hover:text-emerald-400 transition-colors">Student Leaderboard</Link></li>
            </ul>
          </div>

          {/* Col 2: Employment & Jobs */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Briefcase size={14} /> Jobs & Careers
            </h3>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              <li><Link to="/jobs" className="hover:text-emerald-400 transition-colors">Nearby Green Jobs</Link></li>
              <li><Link to="/hiring-exams" className="hover:text-emerald-400 transition-colors">Hiring Exams</Link></li>
              <li><Link to="/employer" className="hover:text-emerald-400 transition-colors">For Employers</Link></li>
              <li><Link to="/post-job" className="hover:text-emerald-400 transition-colors">Post an Opportunity</Link></li>
              <li><Link to="/talent" className="hover:text-emerald-400 transition-colors">Hire Rural Talent</Link></li>
            </ul>
          </div>

          {/* Col 3: Support & Contact Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <HelpCircle size={14} /> Support & Hub
            </h3>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Our Mission</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
              <li><Link to="/faq" className="hover:text-emerald-400 transition-colors">FAQs & Guides</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* Middle Section: Newsletter & Contact Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 border-b border-emerald-900/40 items-center">
          
          {/* Newsletter Box */}
          <div className="lg:col-span-7 bg-emerald-950/50 border border-emerald-800/40 rounded-xl p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 max-w-sm">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Mail className="text-emerald-400" size={15} /> Subscribe to Green Innovation News
                </h4>
                <p className="text-[11px] text-slate-400">
                  Get weekly alerts on free solar, agri-tech courses, and job fairs.
                </p>
              </div>

              {subscribed ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Subscribed!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto bg-slate-900/90 rounded-lg p-1 border border-emerald-800/60 focus-within:border-emerald-500 transition-all">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email" 
                    required
                    className="bg-transparent px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none w-full sm:w-44"
                  />
                  <button 
                    type="submit"
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-all shadow-sm shrink-0"
                  >
                    Subscribe <Send size={11} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Direct Contact Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400 shrink-0">
                <Mail size={15} />
              </div>
              <div className="text-[11px] space-y-0">
                <span className="text-slate-400 font-medium block text-[10px]">Email Support</span>
                <p className="font-bold text-white tracking-wide truncate">support@greenskill.org</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400 shrink-0">
                <Phone size={15} />
              </div>
              <div className="text-[11px] space-y-0">
                <span className="text-slate-400 font-medium block text-[10px]">Rural Helpline</span>
                <p className="font-bold text-white tracking-wide">+91 1800-GREEN-SKILL</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-5 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-emerald-400" />
            <span>© 2026 GreenSkill Rural Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/40 text-[10px] font-bold text-emerald-400">
              🌱 100% Carbon-Neutral Ecosystem
            </span>
            <span className="text-slate-400">
              Empowering India with <Heart size={11} className="inline text-emerald-400 fill-emerald-400 mx-0.5" /> for Sustainable Future
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
