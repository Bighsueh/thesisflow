import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TeacherLayout } from '../components/teacher/TeacherLayout'
import { TeacherSidebar } from '../components/teacher/TeacherSidebar'
import { TeachingFlowSection } from '../components/teacher/TeachingFlowSection'
import { StudentAccountSection } from '../components/teacher/StudentAccountSection'
import { StudentGroupSection } from '../components/teacher/StudentGroupSection'
import { useAuthStore } from '../authStore'

export default function TeacherHome() {
  const navigate = useNavigate()
  const { user, hydrate } = useAuthStore()
  const [activeSection, setActiveSection] = useState<'flows' | 'accounts' | 'groups'>('flows')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  return (
    <TeacherLayout
      sidebar={
        <TeacherSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      }
    >
      {activeSection === 'flows' && <TeachingFlowSection />}
      {activeSection === 'accounts' && <StudentAccountSection />}
      {activeSection === 'groups' && <StudentGroupSection />}
    </TeacherLayout>
  )
}
