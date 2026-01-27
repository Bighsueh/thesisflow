import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CohortDetail from '../components/CohortDetail';
import { TeacherLayout } from '../components/teacher/TeacherLayout';
import { TeacherSidebar } from '../components/teacher/TeacherSidebar';

export default function TeacherCohort() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();

  if (!cohortId) {
    return null;
  }

  const handleSectionChange = (_section: 'accounts' | 'groups') => {
    // 導向教師首頁
    navigate('/teacher');
  };

  return (
    <TeacherLayout
      sidebar={<TeacherSidebar activeSection="groups" onSectionChange={handleSectionChange} />}
    >
      <CohortDetail cohortId={cohortId} />
    </TeacherLayout>
  );
}
