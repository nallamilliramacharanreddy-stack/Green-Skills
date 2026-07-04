import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const geoAPI = {
  geocodePincode: async (pincode, country = 'in') => {
    try {
      const response = await axios.get(`${API_URL}/geo/geocode`, {
        params: { pincode, country },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error geocoding pincode:', error);
      throw error;
    }
  },

  updateLocation: async (latitude, longitude, trackingEnabled = true) => {
    try {
      const response = await axios.post(`${API_URL}/geo/location`, 
        { latitude, longitude, trackingEnabled },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },
  
  getNearbyJobs: async (latitude, longitude, maxDistance = 50000, skills = '') => {
    try {
      const response = await axios.get(`${API_URL}/jobs/nearby`, {
        params: { lat: latitude, lng: longitude, maxDistance, skills },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby jobs:', error);
      throw error;
    }
  }
};

export default geoAPI;
