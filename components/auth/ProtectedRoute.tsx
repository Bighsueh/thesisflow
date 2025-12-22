import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'teacher' | 'student'
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user } = useAuthStore()

  // 未登入，重定向到登入頁
  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  // 需要特定角色，但用戶角色不符
  if (requiredRole && user.role !== requiredRole) {
    // 重定向到對應角色的首頁
    const roleHome = user.role === 'teacher' ? '/teacher' : '/dashboard'
    return <Navigate to={roleHome} replace />
  }

  return <>{children}</>
}



