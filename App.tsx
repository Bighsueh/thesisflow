import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
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
            user ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projects"
          element={
            user ? (
              <Layout>
                <ProjectsPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/groups"
          element={
            user ? (
              <Layout>
                <GroupsPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/literature"
          element={
            user ? (
              <Layout>
                <LiteraturePage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <Layout>
                <ProfilePage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/student/project"
          element={user ? <StudentInterface /> : <Navigate to="/login" replace />}
        />

        {/* Teacher Routes (without Layout) */}
        <Route
          path="/teacher/designer"
          element={user ? <TeacherInterface /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/teacher"
          element={user ? <TeacherHome /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/teacher/cohorts/:cohortId"
          element={user ? <TeacherCohort /> : <Navigate to="/login" replace />}
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
