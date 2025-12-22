import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { ProjectsPage } from './pages/ProjectsPage'
import { GroupsPage } from './pages/GroupsPage'
import { LiteraturePage } from './pages/LiteraturePage'
import { ProfilePage } from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import TeacherHome from './pages/TeacherHome'
import TeacherCohort from './pages/TeacherCohort'
import TeacherInterface from './components/TeacherInterface'
import StudentInterface from './components/StudentInterface'
import { useAuthStore } from './authStore'

export function App() {
  const { hydrate, user } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <BrowserRouter>
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
        <Route
          path="/student"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
