import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin'].includes(user.role)) {
      return <Navigate to="/admin" />;
    } else if (user.role === 'employer') {
      return <Navigate to="/employer" />;
    } else if (user.role === 'guide') {
      return <Navigate to="/guide" />;
    } else if (user.role === 'support') {
      return <Navigate to="/support" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  
  if (user) {
    if (['admin', 'admin_course', 'admin_hiring', 'admin_exam', 'super-admin'].includes(user.role)) {
      return <Navigate to="/admin" />;
    } else if (user.role === 'employer') {
      return <Navigate to="/employer" />;
    } else if (user.role === 'guide') {
      return <Navigate to="/guide" />;
    } else if (user.role === 'support') {
      return <Navigate to="/support" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
};
