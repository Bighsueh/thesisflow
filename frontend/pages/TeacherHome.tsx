import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { StudentAccountSection } from '../components/teacher/StudentAccountSection';
import { StudentGroupSection } from '../components/teacher/StudentGroupSection';
import { TeacherLayout } from '../components/teacher/TeacherLayout';
import { TeacherSidebar } from '../components/teacher/TeacherSidebar';

interface TeacherHomeProps {
  initialSection?: 'accounts' | 'groups';
}

export default function TeacherHome({ initialSection = 'groups' }: TeacherHomeProps) {
  const navigate = useNavigate();
  const { user, hydrate } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'accounts' | 'groups' | 'dashboard'>(
    initialSection
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <TeacherLayout
      sidebar={<TeacherSidebar activeSection={activeSection} onSectionChange={setActiveSection} />}
    >
      {activeSection === 'accounts' && <StudentAccountSection />}
      {activeSection === 'groups' && <StudentGroupSection />}
    </TeacherLayout>
  );
}
