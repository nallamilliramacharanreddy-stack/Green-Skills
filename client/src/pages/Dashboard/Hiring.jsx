import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Briefcase, MapPin, DollarSign, 
  Building2, ExternalLink, Star,
  Clock, ShieldCheck, Zap, ArrowRight, CheckCircle, Search, Filter, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const Hiring = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  const handleApply = async (job) => {
    if (!user) {
      toast.error('Identity Authorization Required');
      return;
    }
    setApplying(job._id);
    try {
      await axios.post(`${API_URL}/applications/apply`, {
        jobId: job._id,
        studentId: user._id,
        employerId: job.postedBy,
        resume: user.profilePicture || '',
        coverLetter: 'I am interested in this green energy role.'
      });
      toast.success(`Application transmitted to ${job.companyName}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Application transfer failed');
    } finally {
      setApplying(null);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API_URL}/jobs`);
        setJobs(res.data);
      } catch (error) {
        toast.error('Failed to sync market vectors');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
              Job<br/><span className="text-primary">Portal.</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Verified Green Career Hub</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Search verified roles..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider placeholder:text-slate-400" />
            </div>
            <button className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-primary transition-all shadow-xl shadow-slate-900/20">
              <Filter size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Market Data</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {jobs.map((job, i) => (
              <motion.div 
                key={job._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white rounded-[3rem] p-1 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all border border-slate-100"
              >
                <div className="absolute inset-0 bg-[conic-gradient(from_180deg,transparent_0_340deg,rgba(16,185,129,0.1)_360deg)] group-hover:animate-[spin_4s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative h-full w-full bg-white rounded-[2.8rem] overflow-hidden z-10 flex flex-col">
                  {/* Hero Image Area */}
                  <div className="h-64 relative bg-slate-900 overflow-hidden">
                    <img 
                      src={job.image || "https://images.unsplash.com/photo-1466611653911-954ffea112d8?auto=format&fit=crop&q=80&w=800"} 
                      alt={job.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-80 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    
                    <div className="absolute top-6 right-6">
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Verified</span>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-6 left-8 flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-[1.2rem] flex items-center justify-center shadow-2xl overflow-hidden border-2 border-white">
                         <Building2 className="text-slate-900" size={28} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{job.companyName}</h4>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {job.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-8 md:p-10 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">{job.title}</h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8 line-clamp-3">
                        Join our mission to revolutionize rural energy systems and implement sustainable technological solutions for a greener tomorrow. This role involves direct deployment of green infrastructure.
                      </p>
                    </div>

                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <DollarSign size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Comp</p>
                            <p className="text-sm font-black text-slate-900">{job.salary}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Briefcase size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role Type</p>
                            <p className="text-sm font-black text-slate-900">Full Time</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleApply(job)}
                          disabled={applying === job._id}
                          className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {applying === job._id ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Transmitting...</>
                          ) : (
                            <>Initialize Protocol <ArrowRight size={14} /></>
                          )}
                        </button>
                        <button className="w-14 h-14 bg-slate-50 border border-slate-200 text-slate-400 rounded-[1.5rem] flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all">
                          <ExternalLink size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {jobs.length === 0 && (
              <div className="col-span-full">
                <div className="bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-slate-300">
                    <Zap size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">The Nexus is Silent</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-sm">Active opportunities are currently being synchronized by the administration. Check back shortly.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Hiring;
