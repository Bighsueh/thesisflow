import type { TourConfig } from '../../tourStore';
import { dashboardTour } from './dashboardTour';
import { groupsTour } from './groupsTour';
import { literatureTour } from './literatureTour';
import { projectsTour } from './projectsTour';
import { studentInterfaceTour } from './studentInterfaceTour';

// 所有導覽配置列表
export const allTours: TourConfig[] = [
  dashboardTour,
  literatureTour,
  studentInterfaceTour,
  projectsTour,
  groupsTour,
];

// 根據頁面路徑獲取導覽 ID
export function getTourIdByPath(path: string): string | null {
  const tourMap: Record<string, string> = {
    '/dashboard': 'dashboard-intro',
    '/literature': 'literature-upload',
    '/student/project': 'student-interface',
    '/projects': 'projects-management',
    '/groups': 'groups-join',
  };
  return tourMap[path] || null;
}

// 根據 ID 獲取導覽配置
export function getTourById(id: string): TourConfig | undefined {
  return allTours.find((tour) => tour.id === id);
}

// 根據導覽 ID 獲取對應的路徑
export function getPathByTourId(tourId: string): string | null {
  const reverseMap: Record<string, string> = {
    'dashboard-intro': '/dashboard',
    'literature-upload': '/literature',
    'student-interface': '/student/project',
    'projects-management': '/projects',
    'groups-join': '/groups',
  };
  return reverseMap[tourId] || null;
}

// 導出各個導覽配置
export { dashboardTour, groupsTour, literatureTour, projectsTour, studentInterfaceTour };
