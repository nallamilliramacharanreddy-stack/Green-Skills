import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../utils/api';

const RealTimeContext = createContext();

export const useRealTime = () => useContext(RealTimeContext);

export const RealTimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time server');
      newSocket.emit('join_room', `user_${user._id}`);
      if (user.role === 'admin' || user.role === 'support') {
        newSocket.emit('join_room', 'admin_alerts');
      }
    });

    newSocket.on('receive_message', (data) => {
      // Show real-time notification using existing toast system
      toast(data.message, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <RealTimeContext.Provider value={{ socket }}>
      {children}
    </RealTimeContext.Provider>
  );
};
