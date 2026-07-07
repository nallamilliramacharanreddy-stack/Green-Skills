import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Building, DollarSign, Briefcase, ChevronRight, Map as MapIcon, Grid } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../utils/api';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const jobIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Auto bounds component for map
function SetMapBounds({ jobs, userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation && jobs.length > 0) {
      const bounds = L.latLngBounds([userLocation]);
      jobs.forEach(job => bounds.extend([job.latitude, job.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation) {
      map.setView(userLocation, 13);
    }
  }, [jobs, userLocation, map]);
  return null;
}

export default function NearbyJobs() {
  const [phase, setPhase] = useState('requesting_permission'); // requesting_permission, animating, results, error
  const [userLocation, setUserLocation] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loadingText, setLoadingText] = useState('Searching nearby jobs...');
  const [viewMode, setViewMode] = useState('grid'); // grid or map
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          startSearchAnimation(loc);
        },
        (error) => {
          console.error("Location error:", error);
          setErrorMsg('Location access denied or unavailable. Please enable location to find nearby jobs.');
          setPhase('error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setErrorMsg('Geolocation is not supported by your browser.');
      setPhase('error');
    }
  }, []);

  const startSearchAnimation = (loc) => {
    setPhase('animating');
    
    // Sequence loading texts
    setTimeout(() => setLoadingText('Finding employers...'), 1000);
    setTimeout(() => setLoadingText('Matching your location...'), 2000);
    setTimeout(() => setLoadingText('Almost done...'), 3000);

    // Fetch jobs in background
    axios.get(`${API_URL}/geo-tracker/nearby?lat=${loc.lat}&lng=${loc.lng}`)
      .then(res => {
        if (res.data.success) {
          setJobs(res.data.jobs);
        }
      })
      .catch(err => {
        console.error('Error fetching nearby jobs', err);
        toast.error('Failed to fetch nearby jobs');
      })
      .finally(() => {
        // Ensure animation runs for at least 4 seconds total
        setTimeout(() => {
          setPhase('results');
        }, 4000);
      });
  };

  const renderAnimation = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Expanding scanning circles */}
        <motion.div 
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-24 h-24 border-[3px] border-[#00E5FF] rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
          className="absolute w-24 h-24 border-[3px] border-[#4F46E5] rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
          className="absolute w-24 h-24 border-[3px] border-[#00E5FF] rounded-full"
        />
        
        {/* Central GPS Icon */}
        <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-[#00E5FF] to-[#4F46E5] rounded-full shadow-[0_0_40px_rgba(0,229,255,0.6)] flex items-center justify-center">
          <Navigation size={36} className="text-white drop-shadow-md" />
        </div>
        
        {/* Little markers popping up */}
        <motion.div 
          animate={{ y: [10, 0, 10], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          className="absolute top-4 left-4"
        >
          <MapPin className="text-rose-500 drop-shadow-md" size={24} />
        </motion.div>
        <motion.div 
          animate={{ y: [10, 0, 10], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-8 right-0"
        >
          <MapPin className="text-rose-500 drop-shadow-md" size={20} />
        </motion.div>
      </div>

      <motion.h3 
        key={loadingText}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 text-2xl font-black text-slate-700 tracking-tight"
      >
        {loadingText}
      </motion.h3>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-40 h-40 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <MapPin size={64} className="text-slate-300" />
      </div>
      <h3 className="text-2xl font-black text-slate-800 mb-2">No nearby jobs found</h3>
      <p className="text-slate-500 max-w-md">We couldn't find any active vacancies within a 30 KM radius of your location. Please check back later.</p>
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {jobs.map((job) => (
        <motion.div 
          key={job._id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-[0_20px_60px_rgba(0,229,255,0.15)] transition-all group relative overflow-hidden flex flex-col"
        >
          {/* Top Info */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {job.hirerId?.profilePicture ? (
                  <img src={job.hirerId.profilePicture} alt="company logo" className="w-full h-full object-cover" />
                ) : (
                  <Building className="text-slate-400" size={20} />
                )}
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-primary transition-colors">{job.jobTitle}</h3>
                <p className="text-slate-500 text-sm font-medium">{job.companyName}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end shrink-0 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
              <span className="text-primary font-black text-sm">{job.distance.toFixed(1)} KM</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Away</span>
            </div>
          </div>

          <div className="space-y-3 mb-6 flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
              <MapPin size={16} className="text-rose-500 shrink-0" />
              <span className="truncate">{job.address}</span>
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg flex-1">
                <DollarSign size={16} className="text-emerald-500" />
                <span className="font-medium truncate">{job.salary || 'Not disclosed'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg flex-1">
                <Briefcase size={16} className="text-amber-500" />
                <span className="font-medium">{job.experience || 'Any Exp'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
              View Details
            </button>
            <button className="flex-1 py-3 bg-gradient-to-r from-[#00E5FF] to-[#4F46E5] text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-1 group/btn">
              Apply Now
              <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderMap = () => (
    <div className="h-[600px] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 relative z-0">
      <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup><strong>You are here</strong></Popup>
        </Marker>
        {jobs.map(job => (
          <Marker key={job._id} position={[job.latitude, job.longitude]} icon={jobIcon}>
            <Popup>
              <div className="min-w-[200px]">
                <h4 className="font-black text-sm">{job.jobTitle}</h4>
                <p className="text-xs font-medium text-slate-500 mb-2">{job.companyName}</p>
                <p className="text-xs text-primary font-bold">{job.distance.toFixed(1)} KM Away</p>
                <button className="mt-2 w-full py-1.5 bg-[#4F46E5] text-white text-xs font-bold rounded-lg hover:bg-opacity-90">View Job</button>
              </div>
            </Popup>
          </Marker>
        ))}
        <SetMapBounds jobs={jobs} userLocation={[userLocation.lat, userLocation.lng]} />
      </MapContainer>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <MapPin className="text-[#4F46E5]" /> 
            Nearby Jobs <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full uppercase tracking-widest">{jobs.length} Found</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Discover opportunities within a 30 KM radius of your current location.</p>
        </div>
        
        {phase === 'results' && jobs.length > 0 && (
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Grid size={16} /> Grid
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MapIcon size={16} /> Map
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'requesting_permission' && (
          <motion.div key="perm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 text-center">
            <p className="text-lg text-slate-500 animate-pulse">Requesting location permission...</p>
          </motion.div>
        )}
        
        {phase === 'animating' && (
          <motion.div key="anim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderAnimation()}
          </motion.div>
        )}

        {phase === 'error' && (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center text-rose-500 font-bold">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p>{errorMsg}</p>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div key="res" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {jobs.length === 0 ? renderEmptyState() : (viewMode === 'grid' ? renderGrid() : renderMap())}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
