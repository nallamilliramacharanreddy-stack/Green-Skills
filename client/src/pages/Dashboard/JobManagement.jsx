import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Briefcase, MapPin, DollarSign, 
  Trash2, Edit2, CheckCircle, Clock,
  ChevronRight, AlertCircle, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const JobManagement = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    requirements: '',
    requiredSkills: '',
    companyName: user?.companyName || user?.name || '',
    image: ''
  });

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs/employer/${user._id}`);
      setJobs(res.data);
    } catch (error) {
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchJobs();
  }, [user]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
        toast.success('Image loaded from gallery');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        requirements: formData.requirements.split(',').map(r => r.trim()),
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()),
        postedBy: user._id,
        status: 'pending' // Admin must approve jobs too
      };
      await axios.post(`${API_URL}/jobs`, formattedData);
      toast.success('Job Recruitment Notice Sent for Admin Approval');
      setShowForm(false);
      fetchJobs();
      setFormData({
        title: '', description: '', location: '', 
        salary: '', requirements: '', requiredSkills: '',
        companyName: user?.companyName || user?.name || '',
        image: ''
      });
    } catch (error) {
      toast.error('Failed to create job');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Job Management</h2>
          <p className="text-slate-500 text-sm font-medium">Create and deploy recruitment notices to the Nexus.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          {showForm ? <ChevronRight className="rotate-90" /> : <Plus />}
          {showForm ? 'Close Form' : 'Post New Job'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-10 rounded-[32px] border-2 border-primary/20 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Job Title</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-medium"
                    placeholder="e.g. Senior Solar Technician"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-medium"
                    placeholder="e.g. Remote / Bangalore"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Salary Range</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-medium"
                    placeholder="e.g. 5LPA - 8LPA"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Company Display Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-medium"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Banner Image (Cinematic Preview)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block ml-1">Option A: Image URL</span>
                      <input 
                        type="text"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-medium text-sm"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={formData.image.startsWith('data:') ? '' : formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block ml-1">Option B: Upload from Gallery</span>
                      <label className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 border border-dashed border-slate-300 hover:border-primary/50 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all text-sm font-bold text-slate-600 h-[50px]">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {formData.image.startsWith('data:') ? 'Image Selected ✓' : 'Choose Image File'}
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                  {formData.image && (
                    <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-200 h-40 bg-slate-100 flex items-center justify-center">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, image: ''})}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors text-xs font-bold shadow-md"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Job Description</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-medium"
                  placeholder="Describe the role and responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Requirements (comma separated)</label>
                  <input 
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-medium"
                    placeholder="B.Tech, 2+ Years Experience, etc."
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Required Skills (comma separated)</label>
                  <input 
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-medium"
                    placeholder="React, Solar Design, AutoCAD"
                    value={formData.requiredSkills}
                    onChange={(e) => setFormData({...formData, requiredSkills: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-primary transition-all shadow-xl shadow-slate-900/20 uppercase tracking-tighter"
              >
                Deploy Recruitment Notice
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          jobs.map((job) => (
            <motion.div 
              key={job._id}
              layout
              className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 transition-colors">
                  <Briefcase className="text-slate-400 group-hover:text-primary transition-colors" size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      job.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      job.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 italic">{job.companyName}</p>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-primary" /> {job.salary}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                  <Edit2 size={20} />
                </button>
                <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 text-red-500 transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))
        )}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <FileText className="mx-auto w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Jobs Deployed</h3>
            <p className="text-slate-400 text-sm mt-2">Initialize your recruitment drive by posting a new job.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobManagement;
