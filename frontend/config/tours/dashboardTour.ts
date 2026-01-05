import type { TourConfig } from '../../tourStore';

export const dashboardTour: TourConfig = {
  id: 'dashboard-intro',
  title: '儀表板導覽',
  description: '了解如何使用 ThesisFlow 儀表板管理您的研究專案',
  steps: [
    {
      target: 'body',
      title: '歡迎使用 ThesisFlow！',
      description:
        '這是您的專屬儀表板，在這裡您可以一覽所有專案進度、最近文獻和群組資訊。讓我們快速認識各個區域。',
      placement: 'center',
      spotlightShape: 'none',
    },
    {
      target: '[data-tour="projects-section"]',
      title: '進行中的專案',
      description:
        '這裡顯示您正在進行的研究專案。點擊專案卡片可以進入專案工作區，開始閱讀文獻、標記重點和撰寫任務。',
      placement: 'bottom',
      spotlightShape: 'rect',
      highlightPulse: true,
    },
    {
      target: '[data-tour="project-card-example"]',
      title: '專案卡片詳情',
      description:
        '每個專案卡片顯示：• 專案標題（如「社群媒體對青少年心理健康影響」）• 當前階段（如「Task B: 單篇摘要」）• 完成進度百分比',
      placement: 'right',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="enter-project-button"]',
      title: '進入專案工作區',
      description:
        '點擊「進入」按鈕即可進入該專案的工作區。您可以在工作區中與 AI 助手互動、上傳文獻、進行文獻標記和完成寫作任務。',
      placement: 'bottom',
      spotlightShape: 'rect',
      highlightPulse: true,
    },
    {
      target: '[data-tour="literature-section"]',
      title: '最近上傳的文獻',
      description:
        '這裡顯示您最近上傳的 PDF 文獻。系統會自動進行 RAG 處理，讓 AI 助手能夠理解文獻內容並回答您的問題。',
      placement: 'top',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="literature-card-example"]',
      title: '文獻卡片與 RAG 狀態',
      description:
        '每個文獻卡片顯示文獻標題、上傳日期和 RAG 處理狀態。綠色勾選表示已完成處理，黃色進度條表示正在處理中。',
      placement: 'left',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="cohorts-section"]',
      title: '群組資訊',
      description: '這裡顯示您加入的學生群組。群組由授課教師建立，用於分配專案流程和管理學習進度。',
      placement: 'left',
      spotlightShape: 'rect',
    },
    {
      target: 'body',
      title: '開始探索吧！',
      description:
        '您可以從左側導覽列前往「專案」、「文獻庫」或「群組」頁面。如需再次查看導覽，請點擊右上角的「?」按鈕。',
      placement: 'center',
      spotlightShape: 'none',
    },
  ],
};
