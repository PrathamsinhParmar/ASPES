import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/Common/DashboardLayout';
import ProtectedRoute from './components/Common/ProtectedRoute';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Theme Context
import { ThemeProvider } from './context/ThemeContext';

// Notification Context & Alert Modal
import { NotificationProvider } from './context/NotificationContext';
import EvaluationAlertModal from './components/Notification/EvaluationAlertModal';

// Loading Component
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages (lazy-loaded for performance)
const HomePage       = lazy(() => import('./pages/HomePage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const RegisterPage   = lazy(() => import('./pages/RegisterPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage   = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetail  = lazy(() => import('./pages/ProjectDetailPage'));
const SubmitProject  = lazy(() => import('./pages/SubmitProjectPage'));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'));
const FacultyListPage = lazy(() => import('./pages/FacultyListPage'));
const FacultyDashboardViewPage = lazy(() => import('./pages/FacultyDashboardViewPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const AssignedProjectsPage = lazy(() => import('./pages/AssignedProjectsPage'));
const FacultyReviewPortal = lazy(() => import('./components/Dashboard/FacultyDashboard'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));


// AI Layer Pages (lazy-loaded)
const AICodeDetectorPage    = lazy(() => import('./pages/ai-layers/AICodeDetectorPage'));
const CodeAnalyzerPage      = lazy(() => import('./pages/ai-layers/CodeAnalyzerPage'));
const ComprehensiveScorerPage = lazy(() => import('./pages/ai-layers/ComprehensiveScorerPage'));
const DocEvaluatorPage      = lazy(() => import('./pages/ai-layers/DocEvaluatorPage'));
const FeedbackGeneratorPage = lazy(() => import('./pages/ai-layers/FeedbackGeneratorPage'));
const PlagiarismDetectorPage = lazy(() => import('./pages/ai-layers/PlagiarismDetectorPage'));
const ReportCodeAnalyzerPage = lazy(() => import('./pages/ai-layers/ReportCodeAnalyzerPage'));

// Public Route wrapper (Redirect to dashboard if already logged in)

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner fullScreen />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <EvaluationAlertModal />
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Public Informational & Marketing Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />

            {/* Public Authentication Routes */}
            <Route path="/login" element={
              <PublicRoute><LoginPage /></PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute><RegisterPage /></PublicRoute>
            } />

            {/* Protected Routes - inside DashboardLayout */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard"          element={<DashboardPage />} />
              <Route path="projects"           element={<ProjectsPage />} />
              <Route path="projects/new"       element={<SubmitProject />} />
              <Route path="projects/:id"       element={<ProjectDetail />} />
              <Route path="profile"            element={<ProfilePage />} />
              <Route path="faculty"            element={<FacultyListPage />} />
              <Route path="faculty/:facultyId/dashboard" element={<FacultyDashboardViewPage />} />
              
              <Route path="groups" element={<GroupsPage />} />
              <Route path="assigned" element={<AssignedProjectsPage />} />
              <Route path="review-portal" element={<FacultyReviewPortal />} />
              <Route path="notifications" element={<NotificationsPage />} />

              {/* Evaluation Overview */}
              <Route path="evaluations/:id"    element={<EvaluationPage />} />

              {/* AI Layer Dedicated Pages */}
              <Route path="evaluations/:id/code-detector"  element={<AICodeDetectorPage />} />
              <Route path="evaluations/:id/code-analyzer"  element={<CodeAnalyzerPage />} />
              <Route path="evaluations/:id/scorer"         element={<ComprehensiveScorerPage />} />
              <Route path="evaluations/:id/doc-evaluator"  element={<DocEvaluatorPage />} />
              <Route path="evaluations/:id/feedback"       element={<FeedbackGeneratorPage />} />
              <Route path="evaluations/:id/plagiarism"     element={<PlagiarismDetectorPage />} />
              <Route path="evaluations/:id/report-aligner" element={<ReportCodeAnalyzerPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Analytics
        beforeSend={(event) => {
          // Privacy protection: strictly suppress tracking on private student & faculty dashboards
          try {
            const url = new URL(event.url);
            const path = url.pathname;
            const isPrivate = [
              '/dashboard',
              '/projects',
              '/evaluations',
              '/faculty',
              '/groups',
              '/profile',
              '/assigned',
              '/review-portal',
              '/notifications',
            ].some((prefix) => path.startsWith(prefix));

            if (isPrivate) {
              return null;
            }
          } catch (e) {
            if (event.url && (event.url.includes('/dashboard') || event.url.includes('/evaluations'))) {
              return null;
            }
          }
          return event;
        }}
      />
    </NotificationProvider>
  </ThemeProvider>
  );
}

export default App;
