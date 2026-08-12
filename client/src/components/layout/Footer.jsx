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
      const targetEmail = 'nallamilliramacharanreddy@gmail.com';
      const subject = encodeURIComponent('Newsletter Subscription Request');
      const body = encodeURIComponent(`Hello,\n\nI would like to subscribe to Digital Green Skills updates.\n\nSubscriber Email: ${email.trim()}`);
      
      window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

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
        <div className="w-full px-4 md:px-8 lg:px-10 pt-6 pb-2 relative z-10">
          {/* SLEEK COMPACT INTEGRATED CTA BANNER - 100% FULL WIDTH */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-800 via-green-700 to-teal-900 shadow-xl border border-emerald-500/30 px-6 py-6 md:py-7 text-center text-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none"></div>

            <div className="relative z-10 w-full flex flex-col items-center">

              <h2 className="text-xl md:text-2xl font-black tracking-tight mb-2 text-white leading-tight">
                Ready to Build a Better, Greener Future?
              </h2>
              <p className="text-xs md:text-sm text-emerald-100 mb-4 font-medium leading-relaxed">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER MAIN BODY - 100% FULL WIDTH */}
      <div className="w-full px-4 md:px-8 lg:px-10 pt-6 pb-10 relative z-10">
        
        {/* Top Grid: Brand & 3 Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-emerald-900/40">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/50">
                <Leaf className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white">Digital Green <span className="text-emerald-400 font-semibold">Skills</span></span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400/80">Skill Development & Job Matching</span>
              </div>
            </Link>

            <p className="text-xs text-slate-300 leading-relaxed font-normal max-w-sm">
              Digital Green Skill Development and Job Matching for Youth Facing Employment Challenges.
            </p>


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
            <a 
              href="mailto:nallamilliramacharanreddy@gmail.com" 
              className="flex items-center gap-2.5 bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3 hover:border-emerald-500/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Mail size={15} />
              </div>
              <div className="text-[11px] space-y-0 overflow-hidden">
                <span className="text-slate-400 font-medium block text-[10px]">Email Support</span>
                <p className="font-bold text-white tracking-wide truncate text-[10px]" title="nallamilliramacharanreddy@gmail.com">nallamilliramacharanreddy@gmail.com</p>
              </div>
            </a>

            <a 
              href="tel:+919391333377" 
              className="flex items-center gap-2.5 bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3 hover:border-emerald-500/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Phone size={15} />
              </div>
              <div className="text-[11px] space-y-0">
                <span className="text-slate-400 font-medium block text-[10px]">Helpline</span>
                <p className="font-bold text-white tracking-wide">+91 9391333377</p>
              </div>
            </a>
          </div>

        </div>


      </div>
    </footer>
  );
};

export default Footer;
