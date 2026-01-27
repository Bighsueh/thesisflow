import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'teacher' | 'student';
  redirectTo?: string;
}

/**
 * 載入指示器組件
 * 在 hydration 完成前顯示
 */
function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm text-slate-600">載入中...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requiredRole, redirectTo = '/' }: ProtectedRouteProps) {
  const { user, isHydrated } = useAuthStore();

  // 等待 hydration 完成，避免閃爍重定向
  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  // 未登入，重定向到登入頁
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // 需要特定角色，但用戶角色不符
  if (requiredRole && user.role !== requiredRole) {
    // 重定向到對應角色的首頁
    const roleHome = user.role === 'teacher' ? '/teacher' : '/dashboard';
    return <Navigate to={roleHome} replace />;
  }

  return <>{children}</>;
}
