import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Users,
  X,
} from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { modalContentVariants, modalOverlayVariants } from '../../config/animations';
import { allTours } from '../../config/tours';
import { useTourStore, type TourConfig } from '../../tourStore';
import { Button } from '../ui/Button';

interface HelpCenterProps {
  onClose: () => void;
}

// 導覽圖標映射
const tourIcons: Record<string, React.ReactNode> = {
  'dashboard-intro': <LayoutDashboard size={20} />,
  'literature-upload': <FileText size={20} />,
  'student-interface': <BookOpen size={20} />,
  'projects-management': <FolderKanban size={20} />,
  'groups-join': <Users size={20} />,
};

// 導覽圖標背景色映射
const tourIconBgs: Record<string, string> = {
  'dashboard-intro': 'bg-blue-100 text-blue-600',
  'literature-upload': 'bg-orange-100 text-orange-600',
  'student-interface': 'bg-violet-100 text-violet-600',
  'projects-management': 'bg-emerald-100 text-emerald-600',
  'groups-join': 'bg-pink-100 text-pink-600',
};

// 導覽 ID 到路由的映射
const TOUR_ROUTE_MAP: Record<string, string> = {
  'dashboard-intro': '/dashboard',
  'literature-upload': '/literature',
  'student-interface': '/student/project',
  'projects-management': '/projects',
  'groups-join': '/groups',
};

// 路由到導覽 ID 的反向映射
const ROUTE_TO_TOUR_ID: Record<string, string> = {
  '/dashboard': 'dashboard-intro',
  '/literature': 'literature-upload',
  '/student/project': 'student-interface',
  '/projects': 'projects-management',
  '/groups': 'groups-join',
};

export function HelpCenter({ onClose }: HelpCenterProps) {
  const { completedTours, startTour, resetProgress } = useTourStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 獲取當前頁面對應的導覽 ID
  const currentTourId = ROUTE_TO_TOUR_ID[location.pathname];

  // 過濾只顯示當前頁面的導覽
  const visibleTours = currentTourId
    ? allTours.filter((tour) => tour.id === currentTourId)
    : allTours; // 如果路由未映射，顯示所有導覽

  const handleStartTour = (tour: TourConfig) => {
    onClose();

    // 取得導覽對應的路由
    const targetRoute = TOUR_ROUTE_MAP[tour.id];

    if (!targetRoute) {
      // 找不到對應路由，直接啟動（可能是全局導覽）
      setTimeout(() => {
        startTour(tour.id);
      }, 300);
      return;
    }

    // 檢查當前路由是否匹配
    if (location.pathname !== targetRoute) {
      // 需要導航到目標頁面
      setTimeout(() => {
        navigate(targetRoute);
        // 導航後延遲啟動導覽，等待頁面渲染完成
        setTimeout(() => {
          startTour(tour.id);
        }, 500); // 導航後額外 500ms 延遲
      }, 300);
    } else {
      // 已在正確頁面，直接啟動
      setTimeout(() => {
        startTour(tour.id);
      }, 300);
    }
  };

  const handleReset = () => {
    if (window.confirm('確定要重置所有導覽進度嗎？下次訪問各頁面時將重新顯示導覽。')) {
      resetProgress();
      onClose();
    }
  };

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[10000] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="bg-white/90 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                <HelpCircle size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">幫助中心</h2>
                <p className="text-sm text-gray-500">重播導覽教學</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="關閉"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tour List */}
        <div className="p-6 space-y-3 overflow-y-auto max-h-[calc(80vh-200px)]">
          {visibleTours.map((tour) => {
            const isCompleted = completedTours.has(tour.id);
            const icon = tourIcons[tour.id] || <HelpCircle size={20} />;
            const iconBg = tourIconBgs[tour.id] || 'bg-gray-100 text-gray-600';

            return (
              <motion.div
                key={tour.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-white/50 border border-gray-100 rounded-xl hover:border-violet-200 transition-all cursor-pointer"
                onClick={() => handleStartTour(tour)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
                    >
                      {icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tour.title}</h3>
                      <p className="text-sm text-gray-500">{tour.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle size={16} />
                        已完成
                      </span>
                    )}
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            重置所有進度
          </button>
          <Button onClick={onClose}>關閉</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
