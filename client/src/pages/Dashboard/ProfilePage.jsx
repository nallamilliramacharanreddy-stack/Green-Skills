import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Shield, Edit, CheckCircle, Upload, Image as ImageIcon, Check, Award, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL, API_BASE_URL } from '../../utils/api';

const ProfilePage = () => {
  const { user: currentUser, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    mobile: currentUser?.mobile || '',
    age: currentUser?.age || '',
    education: currentUser?.education || '',
    skillsInterested: currentUser?.skillsInterested?.join(', ') || '',
    currentWork: currentUser?.currentWork || '',
    careerGoal: currentUser?.careerGoal || '',
    preferredLanguage: currentUser?.preferredLanguage || '',
    password: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [nameRequests, setNameRequests] = useState([]);
  const [showNameChangeModal, setShowNameChangeModal] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');

  const fetchNameRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/name-change/requests`, {
        params: { userId: currentUser._id }
      });
      setNameRequests(res.data || []);
    } catch (err) {
      console.error('Error fetching name requests:', err);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchNameRequests();
    }
  }, [currentUser]);

  const pendingRequest = nameRequests.find(r => r.status === 'pending');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (selectedFile) {
      data.append('profilePicture', selectedFile);
    }

    // Strict Email Validation
    const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      return toast.error('Email must be in small letters and end with @gmail.com');
    }

    try {
      const res = await axios.put(`${API_URL}/auth/profile/${currentUser._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile Updated Successfully');
      setIsEditing(false);
      const updatedUser = res.data.user;
      updateUser(updatedUser);
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      await axios.put(`${API_URL}/auth/profile/${currentUser._id}`, {
        password: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password update failed');
    }
  };

  return (
    <DashboardLayout role={currentUser?.role || 'student'}>
      <div className="max-w-[1200px] mx-auto py-6 px-4">
        <div className="space-y-10">
          <div className="space-y-1">
            <h2 className="text-5xl font-bold text-slate-900 uppercase tracking-tighter">Identity Profile</h2>
            <p className="text-slate-500 font-medium">Manage your digital identity and platform presence.</p>
          </div>

          <div className="max-w-4xl bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl">
            {!isEditing ? (
              <div className="space-y-12">
                <div className="flex items-center gap-10">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-slate-900 rounded-[40px] flex items-center justify-center text-white text-5xl font-black uppercase  overflow-hidden border-4 border-white shadow-xl">
                      {currentUser?.profilePicture ? (
                        <img src={currentUser.profilePicture.startsWith('http') ? currentUser.profilePicture : `${API_BASE_URL}${currentUser.profilePicture}`} className="w-full h-full object-cover" />
                      ) : (
                        currentUser?.name?.[0]
                      )}
                    </div>
                    {(() => {
                      const score = currentUser?.sustainabilityScore || 0;
                      if (score >= 2000) return <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl z-50" style={{ backgroundColor: '#dcfce7', fontSize: '28px' }} title="Waste Champion">♻️</div>;
                      if (score >= 1000) return <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl z-50" style={{ backgroundColor: '#ffedd5', fontSize: '28px' }} title="Solar Expert">☀️</div>;
                      if (score >= 500) return <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl z-50" style={{ backgroundColor: '#dbeafe', fontSize: '28px' }} title="EV Technician">🚗</div>;
                      return <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl z-50" style={{ backgroundColor: '#d1fae5', fontSize: '28px' }} title="Green Beginner">🌱</div>;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter  leading-none">
                      {currentUser?.name}
                    </h3>
                    <p className="text-primary font-bold uppercase tracking-widest text-xs mt-3 flex items-center gap-2 ">
                      <CheckCircle size={14} /> Identity Authorized
                    </p>
                    {pendingRequest && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <AlertCircle size={14} className="text-amber-500" />
                        Name change request to <strong className="uppercase">"{pendingRequest.newName}"</strong> is pending admin approval.
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 mt-6">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10"
                      >
                        <Edit size={14} /> Edit Identity Details
                      </button>
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="px-8 py-3 bg-white text-slate-800 border border-slate-200 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-lg"
                      >
                        <Lock size={14} className="text-primary" /> Change Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-slate-50">
                  {[
                    { label: 'Primary Email', value: currentUser?.email, isEmail: true },
                    { label: 'Contact Mobile', value: currentUser?.mobile || 'Not Connected' },
                    { label: 'Age', value: currentUser?.age || 'N/A' },
                    { label: 'Education', value: currentUser?.education || 'N/A' },
                    { label: 'Skills Interested', value: currentUser?.skillsInterested?.join(', ') || 'None' },
                    { label: 'Current Occupation', value: currentUser?.currentWork || 'N/A' },
                    { label: 'Career Goal', value: currentUser?.careerGoal || 'N/A' },
                    { label: 'Preferred Language', value: currentUser?.preferredLanguage || 'English' }
                  ].map((item, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                      <p className={`text-base font-semibold text-slate-900 ${item.isEmail ? 'lowercase' : ''}`}>{item.value}</p>
                    </div>
                  ))}

                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="flex flex-col md:flex-row gap-10 items-center">
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="w-32 h-32 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden group relative"
                  >
                    {previewUrl || currentUser?.profilePicture ? (
                      <img src={previewUrl || (currentUser.profilePicture.startsWith('http') ? currentUser.profilePicture : `${API_BASE_URL}${currentUser.profilePicture}`)} className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="text-slate-300" size={32} />
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <ImageIcon className="text-white" size={24} />
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-slate-500 font-medium ">Update your avatar or branding assets. Recommended: 512x512px.</p>
                    <button type="button" onClick={() => fileInputRef.current.click()} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Change Photo</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { name: 'name', label: 'Full Legal Name (Requires Admin approval to edit)', placeholder: 'Your Name' },
                    { name: 'email', label: 'Email Address', placeholder: 'email@example.com' },
                    { name: 'mobile', label: 'Mobile Identification', placeholder: '+91 XXXXX XXXXX' },
                    { name: 'age', label: 'Age', placeholder: '24' },
                    { name: 'education', label: 'Education', placeholder: 'Graduate' },
                    { name: 'skillsInterested', label: 'Skills Interested', placeholder: 'Solar, Tech, Agri' },
                    { name: 'currentWork', label: 'Current Occupation', placeholder: 'Student / Active' },
                    { name: 'careerGoal', label: 'Career Goal', placeholder: 'Engineer / Lead' },
                    { name: 'password', label: 'New Password (Optional)', placeholder: 'Leave blank to keep current' },
                    { name: 'preferredLanguage', label: 'Language', isSelect: true, options: ['ENGLISH', 'HINDI', 'TELUGU', 'TAMIL'] }
                  ].map((f) => (
                    <div key={f.name} className={`space-y-2 ${f.name === 'skillsInterested' ? 'md:col-span-2' : ''}`}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                      {f.isSelect ? (
                        <select
                          name={f.name}
                          value={formData[f.name]}
                          onChange={handleInputChange}
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-sm"
                        >
                          <option value="">SELECT LANG</option>
                          {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            type={f.name === 'password' ? 'password' : 'text'}
                            name={f.name}
                            value={formData[f.name]}
                            onChange={(e) => {
                              const val = f.name === 'email' ? e.target.value.toLowerCase() : e.target.value;
                              setFormData({ ...formData, [f.name]: val });
                            }}
                            placeholder={f.placeholder}
                            disabled={f.name === 'name'}
                            className={`w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-sm ${f.name === 'email' ? 'lowercase' : ''} ${f.name === 'name' ? 'opacity-70 cursor-not-allowed' : ''}`}
                            required={f.name === 'name' || f.name === 'email'}
                          />
                          {f.name === 'name' && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewNameInput('');
                                setShowNameChangeModal(true);
                              }}
                              className="mt-3 px-6 py-2.5 bg-slate-900 hover:bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Request Name Change
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-tighter text-sm hover:bg-primary transition-all shadow-2xl flex items-center justify-center gap-3">
                    <Check size={20} /> Commit Profile Changes
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-12 py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black uppercase tracking-tighter text-sm hover:bg-slate-100 transition-all border border-slate-100">
                    Abort
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        {/* Change Password Modal */}
        <AnimatePresence>
          {isChangingPassword && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-[32px] p-8 border border-slate-100 shadow-2xl space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter ">Change Security Password</h3>
                  <p className="text-xs text-slate-500 font-medium">Update your account authentication credentials.</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-sm"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-tighter text-xs hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ newPassword: '', confirmPassword: '' });
                      }}
                      className="px-6 py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase tracking-tighter text-xs hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Name Change Request Modal */}
        <AnimatePresence>
          {showNameChangeModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-[32px] p-8 border border-slate-100 shadow-2xl space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter ">Request Name Change</h3>
                  <p className="text-xs text-slate-500 font-bold">Admin verification is required for security and certificate integrity.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Name</p>
                    <p className="text-sm font-bold text-slate-700 uppercase">{currentUser?.name}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Requested New Name</label>
                    <input
                      type="text"
                      value={newNameInput}
                      onChange={(e) => setNewNameInput(e.target.value)}
                      placeholder="ENTER NEW FULL NAME"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-sm uppercase"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newNameInput.trim()) return toast.error('Name cannot be empty');
                        try {
                          await axios.post(`${API_URL}/auth/name-change`, {
                            userId: currentUser._id,
                            oldName: currentUser.name,
                            newName: newNameInput.trim()
                          });
                          toast.success('Name change request submitted successfully');
                          setShowNameChangeModal(false);
                          fetchNameRequests();
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to submit request');
                        }
                      }}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-tighter text-xs hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Submit Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNameChangeModal(false)}
                      className="px-6 py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase tracking-tighter text-xs hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
