import { AnimatePresence } from 'framer-motion';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../authStore';
import { useTourStore, type TourConfig } from '../../tourStore';
import { TourOverlay } from './TourOverlay';

// 頁面路徑到導覽 ID 的映射
const PAGE_TOUR_MAP: Record<string, string> = {
  '/dashboard': 'dashboard-intro',
  '/literature': 'literature-upload',
  '/student/project': 'student-interface',
  '/projects': 'projects-management',
  '/groups': 'groups-join',
};

// 判斷是否應該自動啟動導覽
function shouldAutoStartTour(
  tourId: string,
  completedTours: Set<string>,
  isFirstLogin: boolean
): boolean {
  // 首次登入強制啟動 dashboard
  if (tourId === 'dashboard-intro') {
    return isFirstLogin;
  }
  // 其他頁面只在未完成時自動啟動
  return !completedTours.has(tourId);
}

interface TourProviderProps {
  children: React.ReactNode;
  tours: TourConfig[];
}

export function TourProvider({ children, tours }: TourProviderProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const {
    isActive,
    isFirstLogin,
    visitedPages,
    completedTours,
    startTour,
    markPageVisited,
    hydrate,
    setTours,
  } = useTourStore();

  // 初始化：設置導覽配置和恢復狀態
  useEffect(() => {
    setTours(tours);
    hydrate();
  }, [tours, setTours, hydrate]);

  // 監聽首次登入
  useEffect(() => {
    if (user && isFirstLogin && location.pathname === '/dashboard') {
      // 延遲啟動，確保頁面完全加載
      const timer = setTimeout(() => {
        startTour('dashboard-intro');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user, isFirstLogin, location.pathname, startTour]);

  // 監聯路由變化，觸發頁面導覽
  useEffect(() => {
    const path = location.pathname;

    // 記錄訪問
    if (!visitedPages.has(path)) {
      markPageVisited(path);

      // 跳過首次登入的 dashboard（已由上面的 useEffect 處理）
      if (path === '/dashboard' && isFirstLogin) {
        return;
      }

      // 判斷是否自動啟動導覽
      const tourId = PAGE_TOUR_MAP[path];
      if (tourId && shouldAutoStartTour(tourId, completedTours, isFirstLogin)) {
        const timer = setTimeout(() => {
          startTour(tourId);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, visitedPages, completedTours, isFirstLogin, markPageVisited, startTour]);

  return (
    <>
      {children}
      <AnimatePresence>{isActive && <TourOverlay />}</AnimatePresence>
    </>
  );
}
