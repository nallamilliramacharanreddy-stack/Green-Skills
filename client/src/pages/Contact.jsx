import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Phone, Mail, Send, 
  User, MessageSquare, Cpu, Globe,
  Zap
} from 'lucide-react';
import Footer from '../components/layout/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, message } = formData;
    
    // Construct the mailto URL
    const subject = encodeURIComponent(`Contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    const mailtoUrl = `mailto:nallamilliramacharanreddy@gmail.com,bandibswaroopa@gmail.com?subject=${subject}&body=${body}`;
    
    // Open the user's email client
    window.location.href = mailtoUrl;
    
    // Simulation of success state
    toast.success('Signal Transmitted');
    setIsSent(true);
    
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };



  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.6 }}
      className="flex-1 w-full flex flex-col min-h-screen bg-white font-sans pt-32 overflow-x-hidden"
    >
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"
        />
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 relative z-10 mb-10 mt-10">
        
        {/* Advanced Interactive Contact Section */}
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          
          {/* Info Side */}
          <div className="flex-1 space-y-12 w-full lg:max-w-md">
            
            <div className="space-y-6">
              <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-2">
                <Globe size={14} /> Global Support
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">
                Contact <br/><span className="text-primary ">Us</span>
              </h2>
              <p className="text-slate-500 font-medium text-lg pt-4 max-w-sm">
                Have a question or want to explore partnership opportunities? We'd love to hear from you.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 relative mt-12">
              <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-6 p-6 bg-slate-50/80 backdrop-blur-xl rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] group transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-emerald-500/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-colors text-primary shrink-0">
                  <Mail size={24} />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">Primary Mail</span>
                  <p className="text-slate-900 font-bold tracking-tight text-sm truncate">nallamilliramacharanreddy@gmail.com</p>
                </div>
              </motion.div>

              <div className="flex items-center justify-center -my-3 relative z-10">
                <span className="bg-white px-6 py-2 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 shadow-md">OR</span>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-6 p-6 bg-slate-50/80 backdrop-blur-xl rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] group transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-500 shrink-0">
                  <Mail size={24} />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">Alternative Mail</span>
                  <p className="text-slate-900 font-bold tracking-tight text-sm truncate">bandibswaroopa@gmail.com</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Form Side: Advanced Glassmorphic Form */}
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-emerald-500/10 to-transparent rounded-[50px] blur-3xl transform -rotate-6 scale-105 pointer-events-none"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-10 md:p-14 bg-white/90 backdrop-blur-2xl rounded-[50px] border border-white shadow-[0_40px_100px_rgba(0,0,0,0.08)] relative overflow-hidden min-h-[500px] flex flex-col justify-center"
            >
              <AnimatePresence mode="wait">
                {!isSent ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="relative z-10 space-y-8"
                  >
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">YOUR EMAIL</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {[
                        { name: 'name', label: 'Identity Name', icon: User, placeholder: 'YOUR NAME' },
                        { name: 'email', label: 'YOUR MAIL', icon: Mail, placeholder: 'EMAIL@DOMAIN' }
                      ].map((f) => (
                        <div key={f.name} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{f.label}</label>
                          <div className="relative group">
                            <f.icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                              type="text"
                              name={f.name}
                              value={formData[f.name]}
                              onChange={handleChange}
                              placeholder={f.placeholder}
                              className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-sm"
                              required
                            />
                          </div>
                        </div>
                      ))}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">MESSAGE HERE</label>
                        <div className="relative group">
                          <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows="4"
                            placeholder="TYPE YOUR CORE MESSAGE..."
                            className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[32px] outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-sm"
                            required
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-5 bg-slate-900 text-white rounded-full font-black text-lg hover:bg-primary transition-all flex items-center justify-center gap-4 uppercase tracking-tighter shadow-2xl shadow-slate-900/20 group"
                      >
                        SEND MESSAGE <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-8 py-10"
                  >
                    <div className="relative inline-block">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-primary/30"
                      >
                        <Zap size={48} />
                      </motion.div>
                      <motion.div
                        animate={{ opacity: [0, 1, 0], scale: [1, 2, 2.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 border-4 border-primary rounded-[32px]"
                      ></motion.div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter ">Successfully Sent</h3>
                      <p className="text-slate-500 font-medium max-w-xs mx-auto">
                        Your message has been transmitted through the Nexus. We'll be in sync shortly.
                      </p>
                    </div>

                    <button 
                      onClick={() => setIsSent(false)}
                      className="px-8 py-4 border border-slate-200 rounded-full text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-colors"
                    >
                      New Transmission
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

      </div>
      <Footer />
    </motion.div>
  );
};

export default Contact;
