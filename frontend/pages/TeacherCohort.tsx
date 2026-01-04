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

  const handleSectionChange = (section: 'flows' | 'accounts' | 'groups') => {
    if (section === 'groups') {
      // 如果點擊群組管理，導向教師首頁並切換到群組區塊
      navigate('/teacher');
    } else {
      navigate('/teacher');
    }
  };

  return (
    <TeacherLayout
      sidebar={<TeacherSidebar activeSection="groups" onSectionChange={handleSectionChange} />}
    >
      <CohortDetail cohortId={cohortId} />
    </TeacherLayout>
  );
}
