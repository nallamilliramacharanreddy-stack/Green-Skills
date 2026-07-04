import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLiveLocation } from '../hooks/useLiveLocation';
import geoAPI from '../api/geoAPI';
import L from 'leaflet';
import { RefreshCw, MapPin, Briefcase, Navigation, CheckCircle, AlertTriangle } from 'lucide-react';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom User Marker
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const LiveGeoTracker = ({ userSkills = '' }) => {
  const { location, error: gpsError, isLocating, progress: gpsProgress, requestLocation } = useLiveLocation(true);
  const [jobs, setJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchError, setSearchError] = useState('');
  const [maxDistance, setMaxDistance] = useState(50000); // 50km

  const fetchNearbyJobs = async () => {
    if (!location) return;
    
    setIsSearching(true);
    setSearchError('');
    setSearchProgress(20); // Starting query

    try {
      setSearchProgress(50); // Querying DB and calculating Haversine distances
      const nearbyJobs = await geoAPI.getNearbyJobs(location.latitude, location.longitude, maxDistance, userSkills);
      setSearchProgress(80); // Applying Filters and AI Matching Scores
      
      setJobs(nearbyJobs);
      setSearchProgress(100); // Done
    } catch (err) {
      console.error(err);
      setSearchError('Failed to fetch nearby jobs. Please try again.');
      setSearchProgress(0);
    } finally {
      setTimeout(() => setIsSearching(false), 1000);
    }
  };

  useEffect(() => {
    if (location) {
      fetchNearbyJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, maxDistance]);

  const totalProgress = isLocating ? (gpsProgress * 0.5) : (50 + (searchProgress * 0.5));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[700px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-green-600" />
            Live Geo Job Tracker
          </h2>
          <p className="text-sm text-gray-500">Production-grade real-time job radar</p>
        </div>
        <div className="flex gap-3 items-center">
          <select 
            value={maxDistance} 
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="text-sm border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value={10000}>Within 10 km</option>
            <option value={25000}>Within 25 km</option>
            <option value={50000}>Within 50 km</option>
            <option value={100000}>Within 100 km</option>
          </select>
          <button 
            onClick={requestLocation}
            disabled={isLocating || isSearching}
            className="p-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh GPS"
          >
            <RefreshCw className={`w-5 h-5 ${(isLocating || isSearching) ? 'animate-spin text-green-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Progress Bar reflecting actual backend operations */}
      {(isLocating || isSearching || totalProgress === 100) && (
        <div className="bg-gray-200 h-1.5 w-full">
          <div 
            className={`h-full transition-all duration-500 ease-out ${totalProgress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      )}

      {/* Status Banner */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-sm text-blue-800">
        {isLocating && <><RefreshCw className="w-4 h-4 animate-spin" /> Acquiring high-accuracy GPS coordinates...</>}
        {!isLocating && isSearching && <><RefreshCw className="w-4 h-4 animate-spin" /> Calculating Haversine distances & AI matching scores in database...</>}
        {!isLocating && !isSearching && totalProgress === 100 && <><CheckCircle className="w-4 h-4 text-green-600" /> System Ready: Tracking {jobs.length} nearby opportunities.</>}
        {gpsError && <span className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {gpsError}</span>}
        {searchError && <span className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {searchError}</span>}
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Map Area */}
        <div className="flex-1 h-[300px] md:h-full relative z-0">
          {!location ? (
            <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500">
              <MapPin className="w-12 h-12 mb-3 text-gray-400 animate-bounce" />
              <p>Waiting for GPS Coordinates...</p>
              <p className="text-xs mt-1">Please allow location access</p>
            </div>
          ) : (
            <MapContainer 
              center={[location.latitude, location.longitude]} 
              zoom={11} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* User Marker */}
              <Marker position={[location.latitude, location.longitude]} icon={userIcon}>
                <Popup>
                  <strong>Your Live Location</strong><br/>
                  Accuracy: {location.accuracy.toFixed(0)}m
                </Popup>
              </Marker>
              
              {/* Radar Circle */}
              <Circle 
                center={[location.latitude, location.longitude]}
                pathOptions={{ fillColor: 'green', color: 'green', weight: 1, fillOpacity: 0.1 }}
                radius={maxDistance}
              />

              {/* Job Markers */}
              {jobs.map(job => (
                job.geoLocation && job.geoLocation.coordinates && job.geoLocation.coordinates.length === 2 &&
                <Marker 
                  key={job._id} 
                  position={[job.geoLocation.coordinates[1], job.geoLocation.coordinates[0]]}
                >
                  <Popup>
                    <div className="font-semibold">{job.title}</div>
                    <div className="text-sm text-gray-600">{job.companyName}</div>
                    <div className="text-xs mt-1 text-blue-600 font-medium">
                      {(job.calculatedDistance / 1000).toFixed(1)} km away
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Live List Area */}
        <div className="w-full md:w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Live Matches
            </h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              {jobs.length} Found
            </span>
          </div>
          
          <div className="flex-1 p-4 space-y-3">
            {jobs.length === 0 && !isSearching && !isLocating ? (
              <div className="text-center text-gray-500 mt-10">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No jobs found within radius.</p>
                <p className="text-sm mt-1">Try expanding the distance.</p>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
                  {/* Distance Badge */}
                  <div className="absolute top-4 right-4 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                    {(job.calculatedDistance / 1000).toFixed(1)} km
                  </div>
                  
                  <h4 className="font-bold text-gray-800 pr-16">{job.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{job.companyName}</p>
                  
                  {job.matchScore !== undefined && (
                    <div className="mt-2 text-xs font-medium text-purple-600 flex items-center gap-1">
                      AI Match Score: <span className="bg-purple-100 px-1.5 py-0.5 rounded">{job.matchScore} Skills Matched</span>
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{job.city || job.address || 'Location Verified'}</span>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading Skeletons */}
            {(isSearching || isLocating) && Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveGeoTracker;
