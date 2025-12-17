import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TeacherHome from './pages/TeacherHome';
import StudentHome from './pages/StudentHome';
import TeacherCohort from './pages/TeacherCohort';
import TeacherInterface from './components/TeacherInterface';
import StudentInterface from './components/StudentInterface';
import { useAuthStore } from './authStore';

const App = () => {
  const { hydrate, user } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/teacher/designer" element={user ? <TeacherInterface /> : <Navigate to="/login" replace />} />
        <Route path="/teacher" element={user ? <TeacherHome /> : <Navigate to="/login" replace />} />
        <Route path="/teacher/cohorts/:cohortId" element={user ? <TeacherCohort /> : <Navigate to="/login" replace />} />
        <Route path="/student" element={user ? <StudentHome /> : <Navigate to="/login" replace />} />
        <Route path="/student/project" element={user ? <StudentInterface /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;