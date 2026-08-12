import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { 
  Leaf, Play, ChevronLeft, ChevronRight, 
  GraduationCap, Smartphone, PenTool, ShieldCheck, Briefcase, Bot,
  UserPlus, BookOpen, Code, FileBadge, FileText, Rocket,
  Star, ArrowRight, Globe, Users, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/layout/Footer';



const STEPS = [
  { icon: UserPlus, num: 1, title: "Register", desc: "Create your free account" },
  { icon: BookOpen, num: 2, title: "Learn", desc: "Access courses and learning materials" },
  { icon: Code, num: 3, title: "Quiz", desc: "Take quizzes and complete projects" },
  { icon: FileBadge, num: 4, title: "Get Certified", desc: "Earn certificates and badges" },
  { icon: FileText, num: 5, title: "Build Resume", desc: "Create professional resume" },
  { icon: Briefcase, num: 6, title: "Apply Jobs", desc: "Find and apply to relevant jobs" },
  { icon: Rocket, num: 7, title: "Get Hired", desc: "Start your career and grow" }
];

const PLATFORMS = [
  { title: "Interactive Dashboard", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60" },
  { title: "Green Courses", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=60" },
  { title: "AI Mentor", image: "https://images.unsplash.com/photo-1676299081847-824916de030a?w=500&auto=format&fit=crop&q=60" },
  { title: "Certificates", image: "https://images.unsplash.com/photo-1589330694653-efa647532028?w=500&auto=format&fit=crop&q=60" },
  { title: "Job Portal", image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60" },
  { title: "Leaderboard", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&auto=format&fit=crop&q=60" }
];

const TESTIMONIALS = [
  { name: "Anjali Verma", role: "Solar Technician", text: "\"Digital Green Skills helped me learn solar installation and I got a great internship!\"", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" },
  { name: "Rahul Meena", role: "Agriculture Student", text: "\"The courses are easy to understand and very useful for our future.\"", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60" },
  { name: "Suresh Yadav", role: "Wind Energy Engineer", text: "\"I got placed in a top company through the job portal. Thank you Digital Green Skills!\"", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" }
];



export default function Home() {
  const { user } = useAuth();
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-green-200 overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <nav className="w-full bg-white z-50 py-4 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="text-green-600" size={28} />
            <span className="text-xl font-bold text-slate-900 tracking-tight">Digital Green <span className="text-slate-600 font-medium">Skills</span></span>
          </Link>
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-8">
              {[
                { name: 'Home', path: '/' },
                { name: 'About Us', path: '/about' },
                { name: 'Contact', path: '/contact' }
              ].map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path}
                  onClick={() => {
                    if (item.name === 'Home') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="relative flex flex-col items-center group cursor-pointer"
                >
                  <span className={`text-sm font-semibold transition-colors ${item.name === 'Home' ? 'text-green-600' : 'text-slate-600 hover:text-green-600'}`}>
                    {item.name}
                  </span>
                  {item.name === 'Home' && <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-green-600"></div>}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <select 
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block px-3 py-1.5 outline-none font-medium cursor-pointer"
                value={currentLang}
                onChange={handleLanguageChange}
              >
                <optgroup label="Common">
                  <option value="en">English (Default)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                </optgroup>
                <optgroup label="Regional">
                  <option value="ta">தமிழ் (Tamil)</option>
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

              {!user ? (
                <>
                  <Link to="/login" className="px-6 py-2 rounded-full border border-green-600 text-green-600 text-sm font-bold hover:bg-green-50 transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="px-6 py-2 rounded-full bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors">
                    Sign Up
                  </Link>
                </>
              ) : (
                <Link to={user.role === 'admin' ? '/admin' : user.role === 'employer' ? '/employer' : '/dashboard'} className="px-6 py-2 rounded-full bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-12 pb-24">
        {/* Soft background glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-50/50 to-transparent pointer-events-none -z-10"></div>
        
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Content */}
          <div className="relative z-10 pt-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/50 text-green-700 text-xs font-bold mb-8">
              <Leaf size={14} /> Building a Sustainable Future
            </div>
            
            <h1 className="text-4xl lg:text-[3.4rem] font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
              Digital Green Skill Development & Job Matching for <br/>
              <span className="text-green-600 relative inline-block">
                Youth Facing Employment Challenges
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-green-500" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                  <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-slate-600 text-lg mb-10 max-w-lg leading-relaxed font-medium">
              Learn in-demand green skills, get certified, build your career, and connect with top employers driving a sustainable future.
            </p>
            
            <div className="flex items-center gap-4 mb-10">
              <Link to={user ? (user.role === 'admin' ? '/admin' : user.role === 'employer' ? '/employer' : '/dashboard') : '/signup'} className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30">
                {user ? 'Go to Dashboard' : 'Start Your Journey'} <ArrowRight size={18} />
              </Link>
              <button className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-50 transition-colors shadow-sm">
                <Play size={18} className="text-green-600 fill-green-600" /> Watch Demo
              </button>
            </div>
            

          </div>

          {/* Right Image & Floating Cards */}
          <div className="relative z-10 hidden lg:flex h-[600px] w-full items-center justify-center">
            {/* The main generated 3D image */}
            <img src="/hero_3d_boy.png" alt="3D Boy with Laptop" className="w-[100%] h-[100%] object-contain z-10 pointer-events-none" />
            
            {/* Floating CSS Cards exactly matching the image layout */}
            {/* Top Left */}
            <div className="absolute top-20 left-10 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-3 flex items-center gap-3 z-20 border border-slate-100">
              <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center"><BookOpen size={20}/></div>
              <div><div className="font-extrabold text-slate-900">250+</div><div className="text-[10px] font-bold text-slate-500 uppercase">Green Courses</div></div>
            </div>
            {/* Top Right */}
            <div className="absolute top-10 right-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-3 flex items-center gap-3 z-20 border border-slate-100">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Users size={20}/></div>
              <div><div className="font-extrabold text-slate-900">15,000+</div><div className="text-[10px] font-bold text-slate-500 uppercase">Active Learners</div></div>
            </div>
            {/* Middle Left */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-3 flex items-center gap-3 z-20 border border-slate-100">
              <div className="w-10 h-10 bg-yellow-100 text-yellow-500 rounded-lg flex items-center justify-center"><Award size={20}/></div>
              <div><div className="font-extrabold text-slate-900">98%</div><div className="text-[10px] font-bold text-slate-500 uppercase">Certification Rate</div></div>
            </div>
            {/* Middle Right */}
            <div className="absolute top-1/2 right-0 translate-y-10 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-3 flex items-center gap-3 z-20 border border-slate-100">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center"><Briefcase size={20}/></div>
              <div><div className="font-extrabold text-slate-900">800+</div><div className="text-[10px] font-bold text-slate-500 uppercase">Jobs Created</div></div>
            </div>
          </div>
        </div>


      </section>


      {/* 5. HOW IT WORKS */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <h2 className="text-4xl font-extrabold text-center text-slate-900 mb-20">How It Works?</h2>
        <div className="relative flex justify-between items-start max-w-6xl mx-auto">
          {/* Dashed Line */}
          <div className="absolute top-8 left-10 right-10 h-0.5 border-t-2 border-dashed border-green-200 -z-10"></div>
          
          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center w-32 bg-white relative">
              <div className="w-16 h-16 bg-white border-4 border-green-50 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-sm z-10">
                <step.icon size={24} />
              </div>
              <div className="text-green-600 font-extrabold text-lg mb-1">{step.num}</div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-2">{step.title}</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. EXPLORE OUR PLATFORM */}
      <section className="bg-slate-50/50 py-24 border-y border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-center text-slate-900 mb-16">Explore Our Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {PLATFORMS.map((plat, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow group">
                {/* Image area */}
                <div className="w-full aspect-[4/3] bg-slate-50 rounded-2xl mb-4 border border-slate-100 overflow-hidden relative">
                  <img src={plat.image} alt={plat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-green-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
                <h4 className="text-center text-sm font-extrabold text-slate-900">{plat.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WHAT OUR LEARNERS SAY */}
      <section className="max-w-[1400px] mx-auto px-6 py-24">
        <h2 className="text-4xl font-extrabold text-center text-slate-900 mb-16">What Our Learners Say</h2>
        <div className="relative flex items-center max-w-7xl mx-auto">
          <button className="absolute -left-16 w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-green-600 shadow-sm z-10"><ChevronLeft size={24}/></button>
          
          <div className="grid md:grid-cols-3 gap-8 w-full">
            {TESTIMONIALS.map((test, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="text-sm text-slate-600 font-medium mb-8 leading-relaxed italic h-16">{test.text}</p>
                <div className="flex items-center gap-4">
                  <img src={test.avatar} alt={test.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-sm">{test.name}</h5>
                    <p className="text-xs text-slate-500 font-medium">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="absolute -right-16 w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-green-600 shadow-sm z-10"><ChevronRight size={24}/></button>
        </div>
      </section>

      {/* FOOTER WITH INTEGRATED SEAMLESS CTA */}
      <Footer />
      
      {/* Floating Chat Icon */}
      <div className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer hover:bg-green-700 transition-colors z-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </div>
    </div>
  );
}
