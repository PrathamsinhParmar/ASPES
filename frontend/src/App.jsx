import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/Common/DashboardLayout';
import ProtectedRoute from './components/Common/ProtectedRoute';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Theme Context
import { ThemeProvider } from './context/ThemeContext';

// Loading Component
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages (lazy-loaded for performance)
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const RegisterPage   = lazy(() => import('./pages/RegisterPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage   = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetail  = lazy(() => import('./pages/ProjectDetailPage'));
const SubmitProject  = lazy(() => import('./pages/SubmitProjectPage'));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'));

// Public Route wrapper (Redirect to dashboard if already logged in)

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner fullScreen />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute><LoginPage /></PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute><RegisterPage /></PublicRoute>
            } />

            {/* Protected Routes - inside DashboardLayout */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"          element={<DashboardPage />} />
              <Route path="projects"           element={<ProjectsPage />} />
              <Route path="projects/new"       element={<SubmitProject />} />
              <Route path="projects/:id"       element={<ProjectDetail />} />
              <Route path="evaluations/:id"    element={<EvaluationPage />} />
              <Route path="profile"            element={<ProfilePage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
