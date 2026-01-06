import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import StudentInterface from './components/student/StudentInterface';
import TeacherInterface from './components/TeacherInterface';
import { TourProvider } from './components/tour/TourProvider';
import { allTours } from './config/tours';
import { Dashboard } from './pages/Dashboard';
import { GroupsPage } from './pages/GroupsPage';
import { LandingPage } from './pages/LandingPage';
import { LiteraturePage } from './pages/LiteraturePage';
import LoginPage from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProjectsPage } from './pages/ProjectsPage';
import TeacherCohort from './pages/TeacherCohort';
import TeacherHome from './pages/TeacherHome';

export function App() {
  const { hydrate, checkTokenExpiry } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 定期檢查 token 是否過期（每 5 分鐘）
  useEffect(() => {
    const interval = setInterval(
      () => {
        checkTokenExpiry();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [checkTokenExpiry]);

  return (
    <BrowserRouter>
      <TourProvider tours={allTours}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <Layout>
                <LandingPage />
              </Layout>
            }
          />
          <Route path="/login" element={<LoginPage />} />

          {/* Student Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute requiredRole="student">
                <Layout>
                  <ProjectsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute requiredRole="student">
                <Layout>
                  <GroupsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/literature"
            element={
              <ProtectedRoute requiredRole="student">
                <Layout>
                  <LiteraturePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/project"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentInterface />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes (without Layout) */}
          <Route
            path="/teacher/designer"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/cohorts/:cohortId"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherCohort />
              </ProtectedRoute>
            }
          />

          {/* Legacy student route redirect */}
          <Route path="/student" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TourProvider>
    </BrowserRouter>
  );
}

export default App;
