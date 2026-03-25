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
              <Route path="profile"            element={<ProfilePage />} />

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
    </ThemeProvider>
  );
}

export default App;
