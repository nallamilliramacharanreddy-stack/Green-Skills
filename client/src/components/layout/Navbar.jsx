import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
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

  // Hide global navbar on dashboard/admin routes
  const hideNavbar = location.pathname === '/' || 
                     location.pathname.includes('/dashboard') || 
                     location.pathname.includes('/admin') || 
                     location.pathname.includes('/employer') || 
                     location.pathname.includes('/guide') || 
                     location.pathname.includes('/support') || 
                     location.pathname.includes('/super-admin');

  if (hideNavbar) return null;

  return (
    <nav className="fixed top-0 w-full z-[100] glass bg-white/70 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="text-primary w-8 h-8" />
            <span className="text-xl font-bold text-darkslate">Digital Green <span className="text-primary">Skills</span></span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-darkslate hover:text-primary transition-colors font-medium">Home</Link>
            <Link to="/about" className="text-darkslate hover:text-primary transition-colors font-medium">About Us</Link>
            <Link to="/contact" className="text-darkslate hover:text-primary transition-colors font-medium">Contact</Link>
            
            {!user && (
              <>
                <select 
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block px-3 py-1.5 outline-none"
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
                <Link to="/hirer/login" className="text-primary hover:text-emerald transition-colors font-black uppercase tracking-tighter text-sm border-l border-gray-200 pl-8">Hirer Portal</Link>
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-primary hover:text-emerald font-bold transition-all px-4">Login</Link>
                  <Link to="/signup" className="px-6 py-2.5 rounded-full bg-primary text-white hover:bg-emerald transition-all shadow-lg shadow-primary/20 font-bold">Signup</Link>
                </div>
              </>
            )}
            {user && (
              <div className="flex items-center space-x-4">
                <Link to={user.role === 'admin' ? '/admin' : user.role === 'employer' ? '/employer' : '/dashboard'} className="px-5 py-2 rounded-full bg-primary text-white hover:bg-emerald transition-all shadow-lg shadow-primary/20">Go to Dashboard</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
