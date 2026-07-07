import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Award, CheckCircle, Mail,
  MapPin, User, ShieldCheck,
  FileText, Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const HiredUsers = () => {
  const { user } = useAuth();
  const [hired, setHired] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHired = async () => {
    try {
      const res = await axios.get(`${API_URL}/applications/employer/${user._id}`);
      // Filter only hired ones
      setHired(res.data.filter(app => app.status === 'hired'));
    } catch (error) {
      toast.error('Failed to load hired portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchHired();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter ">Hired Portfolio</h2>
            <p className="text-slate-400 text-sm font-medium mt-2">Verified placement records for your organization.</p>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-[32px]">
            <ShieldCheck className="text-primary" size={32} />
            <div>
              <p className="text-white text-2xl font-black">{hired.length}</p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Placements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          hired.map((app, i) => (
            <motion.div
              key={app._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-primary/10 transition-colors">
                  <User size={28} className="text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{app.studentId?.name}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{app.studentId?.education}</p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 mb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-primary" />
                  <span className="text-xs font-bold text-slate-600">Role: {app.jobId?.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">Onboarded: {new Date(app.appliedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-primary transition-all shadow-lg shadow-slate-200">
                    <Mail size={18} />
                  </button>
                  <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
                    <FileText size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  <CheckCircle size={12} /> Active
                </div>
              </div>
            </motion.div>
          ))
        )}
        {!loading && hired.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <Award className="mx-auto w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Active Placements</h3>
            <p className="text-slate-400 text-sm mt-2">Candidates hired through the Applications Hub will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HiredUsers;
