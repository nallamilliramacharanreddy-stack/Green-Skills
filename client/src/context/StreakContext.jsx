import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useRealTime } from './RealTimeContext';
import { API_URL } from '../utils/api';

const StreakContext = createContext();

export const useStreak = () => useContext(StreakContext);

export const StreakProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useRealTime();
  
  const [streakData, setStreakData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showCinematic, setShowCinematic] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [cinematicPayload, setCinematicPayload] = useState(null);

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
      if (user.role === 'student') {
        fetchStreak();
        checkDailyContinue();
      }
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('leaderboard_update', () => {
        fetchLeaderboard();
      });
      return () => socket.off('leaderboard_update');
    }
  }, [socket]);

  const fetchStreak = async () => {
    try {
      const res = await axios.get(`${API_URL}/streak/me?userId=${user._id}`);
      if (res.data && res.data.ultraStreak) {
        setStreakData(res.data.ultraStreak);
      }
    } catch (err) {
      console.error('Failed to fetch streak', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/streak/leaderboard`);
      setLeaderboard(res.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    }
  };

  const checkDailyContinue = async () => {
    try {
      const res = await axios.post(`${API_URL}/streak/continue`, { userId: user._id });
      if (res.data.earnedXp > 0 || (res.data.newBadges && res.data.newBadges.length > 0)) {
        setStreakData(res.data.streak);
        setCinematicPayload({
          earnedXp: res.data.earnedXp,
          newBadges: res.data.newBadges,
          streakLevel: res.data.streak.currentStreak
        });
        setShowCinematic(true);
      } else if (res.data.streak) {
        setStreakData(res.data.streak);
      }
    } catch (err) {
      console.error('Failed to continue streak', err);
    }
  };

  return (
    <StreakContext.Provider value={{
      streakData,
      leaderboard,
      showCinematic,
      setShowCinematic,
      cinematicPayload,
      showHub,
      setShowHub,
      checkDailyContinue,
      fetchStreak
    }}>
      {children}
    </StreakContext.Provider>
  );
};
