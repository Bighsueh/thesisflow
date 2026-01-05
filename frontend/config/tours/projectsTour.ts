import type { TourConfig } from '../../tourStore';

export const projectsTour: TourConfig = {
  id: 'projects-management',
  title: '專案列表導覽',
  description: '了解如何管理和搜尋您的研究專案',
  steps: [
    {
      target: '[data-tour="projects-search"]',
      title: '搜尋專案',
      description: '使用搜尋框可以快速找到特定專案。支援按專案標題、學期和標籤進行搜尋。',
      placement: 'bottom',
      spotlightShape: 'rect',
      highlightPulse: true,
    },
    {
      target: '[data-tour="project-list"]',
      title: '專案網格',
      description:
        '所有專案會顯示在此網格中。每個卡片代表一個研究專案，顯示標題、當前階段、進度百分比和狀態標籤。點擊卡片可進入專案工作區。',
      placement: 'bottom',
      spotlightShape: 'rect',
    },
    {
      target: 'body',
      title: '開始工作吧！',
      description:
        '選擇一個專案開始您的文獻探討之旅。在專案工作區中，您可以閱讀文獻、標記重點、與 AI 對話並完成寫作任務。',
      placement: 'center',
      spotlightShape: 'none',
    },
  ],
};
