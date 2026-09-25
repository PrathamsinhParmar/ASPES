import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from '../components/Dashboard/StudentDashboard';
import FacultyDashboard from '../components/Dashboard/FacultyDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) return <LoadingSpinner fullScreen />;

  const role = (user?.role || '').toLowerCase();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
    case 'professor':
      return <Navigate to="/assigned" replace />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
};

export default DashboardPage;
