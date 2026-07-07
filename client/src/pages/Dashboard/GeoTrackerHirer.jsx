import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../utils/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Plus, X, Briefcase, DollarSign, Navigation, Building, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function GeoTrackerHirer() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: user?.companyDetails?.companyName || user?.name || '',
    description: '',
    skills: '',
    salary: '',
    jobType: 'Full-time',
    experience: '',
    vacancies: 1,
    pincode: '',
    address: '',
    city: '',
    state: ''
  });
  const [position, setPosition] = useState(null);
  const [locationMethod, setLocationMethod] = useState('pincode'); // 'pincode' or 'map'
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const res = await axios.get(`${API_URL}/geo-tracker/hirer/${user._id || user.id}`);
      if (res.data.success) {
        setVacancies(res.data.vacancies);
      }
    } catch (error) {
      console.error('Error fetching geo vacancies', error);
      toast.error('Failed to load your geo vacancies');
    }
  };

  const handlePincodeSearch = async () => {
    if (!formData.pincode || formData.pincode.length < 5) {
      toast.error('Please enter a valid pincode');
      return;
    }
    setPinLoading(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?postalcode=${formData.pincode}&country=india&format=json`);
      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        setPosition({ lat: parseFloat(data.lat), lng: parseFloat(data.lon) });
        
        // Try to parse city and state from display_name
        const parts = data.display_name.split(',').map(p => p.trim());
        setFormData(prev => ({
          ...prev,
          city: parts.length > 2 ? parts[0] : prev.city,
          state: parts.length > 1 ? parts[parts.length - 2] : prev.state,
          address: data.display_name
        }));
        toast.success('Location fetched successfully');
      } else {
        toast.error('Could not find location for this pincode');
      }
    } catch (err) {
      console.error('Geocoding error', err);
      toast.error('Error fetching location');
    } finally {
      setPinLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) {
      toast.error('Please set a location (using pincode or map)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()),
        latitude: position.lat,
        longitude: position.lng,
        hirerId: user._id || user.id
      };
      
      const res = await axios.post(`${API_URL}/geo-tracker`, payload);
      if (res.data.success) {
        toast.success('Geo Vacancy Alert Published!');
        fetchVacancies();
        setIsModalOpen(false);
        setFormData({
          jobTitle: '',
          companyName: user?.companyDetails?.companyName || user?.name || '',
          description: '',
          skills: '',
          salary: '',
          jobType: 'Full-time',
          experience: '',
          vacancies: 1,
          pincode: '',
          address: '',
          city: '',
          state: ''
        });
        setPosition(null);
      }
    } catch (error) {
      console.error('Error creating vacancy', error);
      toast.error('Failed to create vacancy');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`${API_URL}/geo-tracker/${id}/status`, { status: newStatus });
      fetchVacancies();
      toast.success(`Vacancy ${newStatus}`);
    } catch (error) {
      console.error('Error updating status', error);
      toast.error('Failed to update status');
    }
  };

  const deleteVacancy = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vacancy?')) return;
    try {
      await axios.delete(`${API_URL}/geo-tracker/${id}`);
      fetchVacancies();
      toast.success('Vacancy deleted');
    } catch (error) {
      console.error('Error deleting vacancy', error);
      toast.error('Failed to delete vacancy');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <MapPin className="text-[#00E5FF]" /> 
            Geo Tracker Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">Post hyper-local job vacancies and track nearby candidates.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#4F46E5] text-white font-bold rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Create Geo Vacancy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vacancies.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
            <MapPin size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No Geo Vacancies yet.</p>
            <p className="text-sm">Create one to start discovering nearby candidates.</p>
          </div>
        ) : (
          vacancies.map((vac) => (
            <motion.div 
              key={vac._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-xl relative overflow-hidden group hover:border-[#00E5FF]/30 transition-all"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${vac.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">{vac.jobTitle}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Building size={14} /> {vac.companyName}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${vac.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {vac.status}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-[#00E5FF]" />
                  <span className="truncate" title={vac.address}>{vac.city}, {vac.state}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign size={16} className="text-[#4F46E5]" />
                  <span>{vac.salary || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Briefcase size={16} className="text-amber-500" />
                  <span>{vac.vacancies} Vacanc{vac.vacancies > 1 ? 'ies' : 'y'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <button 
                  onClick={() => toggleStatus(vac._id, vac.status)}
                  className={`text-sm font-bold flex items-center gap-1 transition-colors ${vac.status === 'Active' ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                >
                  <Power size={16} />
                  {vac.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={() => deleteVacancy(vac._id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Navigation className="text-[#00E5FF]" /> 
                  New Geo Vacancy Alert
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* LEFT: JOB DETAILS */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2">Job Details</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
                      <input required type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none" placeholder="e.g. Senior Frontend Developer" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                      <input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                      <textarea required name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Salary</label>
                        <input type="text" name="salary" value={formData.salary} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none" placeholder="e.g. $80k - $120k" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Vacancies *</label>
                        <input required type="number" min="1" name="vacancies" value={formData.vacancies} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Required Skills (comma separated)</label>
                      <input type="text" name="skills" value={formData.skills} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none" placeholder="React, Node.js, MongoDB" />
                    </div>
                  </div>

                  {/* RIGHT: LOCATION DETAILS */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2">Location Targeting</h3>
                    
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                      <button type="button" onClick={() => setLocationMethod('pincode')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${locationMethod === 'pincode' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Use Pincode</button>
                      <button type="button" onClick={() => setLocationMethod('map')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${locationMethod === 'map' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Pin on Map</button>
                    </div>

                    {locationMethod === 'pincode' && (
                      <div className="space-y-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Enter Pincode</label>
                          <div className="flex gap-2">
                            <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none" placeholder="e.g. 500081" />
                            <button type="button" onClick={handlePincodeSearch} disabled={pinLoading} className="px-4 py-2 bg-[#00E5FF] text-white font-bold rounded-xl hover:bg-[#00cce6] transition-colors disabled:opacity-50">
                              {pinLoading ? '...' : 'Fetch'}
                            </button>
                          </div>
                        </div>
                        {position && (
                          <div className="text-xs text-emerald-600 font-medium bg-emerald-50 p-2 rounded-lg">
                            Location found: {formData.city}, {formData.state}
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Complete Address</label>
                          <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none" placeholder="Building, Street, Area"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                            <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {locationMethod === 'map' && (
                      <div className="space-y-4">
                        <div className="h-[250px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
                          <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker position={position} setPosition={setPosition} />
                          </MapContainer>
                        </div>
                        <p className="text-xs text-slate-500 italic">Click on the map to drop a pin.</p>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Complete Address</label>
                          <textarea required name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] outline-none" placeholder="Provide complete address for this pin location"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                            <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                            <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#00E5FF] to-[#4F46E5] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-70">
                    {loading ? 'Publishing...' : 'Publish Vacancy Alert'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
