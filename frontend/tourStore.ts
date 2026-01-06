import { create } from 'zustand';

// 導覽步驟類型
export interface TourStep {
  target: string; // CSS selector 或 'body'
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightShape?: 'rect' | 'circle' | 'none';
  highlightPulse?: boolean; // 脈動效果
  action?: 'click' | 'scroll'; // 自動觸發動作
}

// 導覽配置類型
export interface TourConfig {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
  icon?: React.ReactNode;
  iconBg?: string;
}

// localStorage 鍵名常量
const STORAGE_KEYS = {
  COMPLETED_TOURS: 'thesisflow_tour_completed',
  VISITED_PAGES: 'thesisflow_tour_visited_pages',
  FIRST_LOGIN: 'thesisflow_tour_first_login',
  LAST_SEEN: 'thesisflow_tour_last_seen',
};

// 導覽狀態接口
interface TourState {
  // 當前狀態
  isActive: boolean;
  currentTourId: string | null;
  currentStep: number;
  currentTour: TourConfig | null;

  // 持久化狀態
  completedTours: Set<string>;
  visitedPages: Set<string>;
  isFirstLogin: boolean;

  // 方法
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  markPageVisited: (path: string) => void;
  resetProgress: () => void;
  hydrate: () => void;
  setTours: (tours: TourConfig[]) => void;
}

// 存儲所有導覽配置
let allTours: TourConfig[] = [];

export const useTourStore = create<TourState>((set, get) => ({
  // 初始狀態
  isActive: false,
  currentTourId: null,
  currentStep: 0,
  currentTour: null,
  completedTours: new Set(),
  visitedPages: new Set(),
  isFirstLogin: true,

  // 設置導覽配置（由 TourProvider 調用）
  setTours: (tours: TourConfig[]) => {
    allTours = tours;
  },

  // 從 localStorage 恢復狀態
  hydrate: () => {
    try {
      const completed = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_TOURS) || '[]');
      const visited = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITED_PAGES) || '[]');
      const hasLoggedIn = localStorage.getItem(STORAGE_KEYS.FIRST_LOGIN);
      const isFirstLogin = !hasLoggedIn;

      set({
        completedTours: new Set(completed),
        visitedPages: new Set(visited),
        isFirstLogin,
      });
    } catch (error) {
      console.error('[Tour] Failed to hydrate tour state:', error);
    }
  },

  // 開始導覽
  startTour: (tourId: string) => {
    const tour = allTours.find((t) => t.id === tourId);
    if (!tour) {
      console.warn(`[Tour] Tour not found: ${tourId}`);
      return;
    }

    set({
      isActive: true,
      currentTourId: tourId,
      currentStep: 0,
      currentTour: tour,
    });
  },

  // 下一步
  nextStep: () => {
    const { currentStep, currentTour } = get();
    if (!currentTour) return;

    if (currentStep < currentTour.steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  // 上一步
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  // 跳過導覽
  skipTour: () => {
    set({
      isActive: false,
      currentTourId: null,
      currentStep: 0,
      currentTour: null,
    });
  },

  // 完成導覽
  completeTour: () => {
    const { currentTourId, completedTours, isFirstLogin } = get();
    if (!currentTourId) return;

    const newCompleted = new Set(completedTours);
    newCompleted.add(currentTourId);

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEYS.COMPLETED_TOURS, JSON.stringify([...newCompleted]));

    // 標記首次登入完成
    if (isFirstLogin) {
      localStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'true');
    }

    // 記錄最後顯示時間
    localStorage.setItem(STORAGE_KEYS.LAST_SEEN, Date.now().toString());

    set({
      completedTours: newCompleted,
      isActive: false,
      currentTourId: null,
      currentStep: 0,
      currentTour: null,
      isFirstLogin: false,
    });
  },

  // 標記頁面已訪問
  markPageVisited: (path: string) => {
    const { visitedPages } = get();
    if (visitedPages.has(path)) return;

    const newVisited = new Set(visitedPages);
    newVisited.add(path);

    localStorage.setItem(STORAGE_KEYS.VISITED_PAGES, JSON.stringify([...newVisited]));

    set({ visitedPages: newVisited });
  },

  // 重置所有進度
  resetProgress: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    set({
      completedTours: new Set(),
      visitedPages: new Set(),
      isFirstLogin: true,
      isActive: false,
      currentTourId: null,
      currentStep: 0,
      currentTour: null,
    });
  },
}));

// 輔助函數：獲取所有導覽配置
export function getAllTours(): TourConfig[] {
  return allTours;
}

// 輔助函數：檢查導覽是否已完成
export function isTourCompleted(tourId: string): boolean {
  return useTourStore.getState().completedTours.has(tourId);
}

// 輔助函數：檢查頁面是否已訪問
export function isPageVisited(path: string): boolean {
  return useTourStore.getState().visitedPages.has(path);
}
