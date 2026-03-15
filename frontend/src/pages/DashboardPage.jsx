import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from '../components/Dashboard/StudentDashboard';
import FacultyDashboard from '../components/Dashboard/FacultyDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) return <LoadingSpinner fullScreen />;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
};

export default DashboardPage;
