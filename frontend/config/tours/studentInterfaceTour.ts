import type { TourConfig } from '../../tourStore';

export const studentInterfaceTour: TourConfig = {
  id: 'student-interface',
  title: '專案工作區導覽',
  description: '學習如何使用 5 個面板進行高效的文獻分析',
  steps: [
    // 第 1 步：整體佈局介紹
    {
      target: 'body',
      title: '歡迎來到專案工作區',
      description:
        '這裡是您進行文獻閱讀、標記、寫作的主要工作空間。工作區由 5 個面板組成，讓我們逐一介紹。',
      placement: 'center',
      spotlightShape: 'none',
    },

    // 第 2-3 步：ReaderPanel
    {
      target: '[data-tour="reader-panel"]',
      title: 'PDF 閱讀器',
      description: '這是主要的閱讀區域，佔據畫面 70%。您可以在此閱讀 PDF 文獻、框選文字進行標記。',
      placement: 'left',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="reader-toolbar"]',
      title: '閱讀工具列',
      description: '使用這些工具切換文獻、管理標記、調整縮放。左側按鈕可開啟文獻庫面板。',
      placement: 'bottom',
      spotlightShape: 'rect',
      highlightPulse: true,
    },

    // 第 4-5 步：標記系統
    {
      target: '[data-tour="reader-panel"]',
      title: '框選文字進行標記',
      description:
        '在 PDF 中框選任何文字，會彈出 5 色圓點工具列。選擇顏色可將文字標記為不同類型的證據（研究目的/方法/發現/限制/其他）。',
      placement: 'right',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="highlight-sidebar"]',
      title: 'Evidence（標記片段）',
      description:
        '標記後的文字會自動儲存為 Evidence，並顯示在此標記管理側邊欄中。您可以為每個 Evidence 命名、編輯或刪除。',
      placement: 'left',
      spotlightShape: 'rect',
    },

    // 第 6-7 步：HighlightSidebar
    {
      target: '[data-tour="highlight-sidebar-toggle"]',
      title: '開啟標記管理側邊欄',
      description: '點擊此按鈕可展開左側的標記管理面板（寬度 300px）。',
      placement: 'right',
      spotlightShape: 'circle',
    },
    {
      target: '[data-tour="highlight-sidebar"]',
      title: '標記管理面板',
      description:
        '所有標記按 5 種顏色分組顯示。您可以拖曳標記到右側的 Chat 或 Task 面板，快速引用證據。',
      placement: 'right',
      spotlightShape: 'rect',
    },

    // 第 8-9 步：LibraryPanel
    {
      target: '[data-tour="library-toggle"]',
      title: '文獻庫面板',
      description: '點擊工具列的文獻庫按鈕，可展開左側的文獻庫面板（寬度 800px）。',
      placement: 'bottom',
      spotlightShape: 'circle',
    },
    {
      target: '[data-tour="library-panel"]',
      title: '綁定與上傳文獻',
      description:
        '此面板分為兩區：上方顯示「已綁定到專案的文檔」，下方顯示「可用文檔庫」。您可以拖曳文檔進行綁定，或上傳新文獻。',
      placement: 'right',
      spotlightShape: 'rect',
    },

    // 第 10 步：ChatPanelWrapper
    {
      target: '[data-tour="chat-panel"]',
      title: 'AI 對話助手',
      description:
        '右側的 Chat 面板提供 AI 教練即時協助。您可以拖曳 Evidence 到輸入框，AI 會根據標記內容提供建議。',
      placement: 'left',
      spotlightShape: 'rect',
    },

    // 第 11 步：TaskPanelWrapper
    {
      target: '[data-tour="task-panel"]',
      title: '任務表單',
      description:
        '右側的 Task 面板顯示當前任務。有 3 種類型：Summary（單篇摘要）、Comparison（兩篇比較）、Synthesis（綜合分析）。寫作時需綁定 Evidence。',
      placement: 'left',
      spotlightShape: 'rect',
    },

    // 第 12 步：面板收合
    {
      target: '[data-tour="panel-collapse-buttons"]',
      title: '收合面板以專注工作',
      description:
        'Chat 和 Task 面板可隨時收合，點擊按鈕即可展開。這樣您可以根據需求調整工作空間佈局。',
      placement: 'left',
      spotlightShape: 'rect',
    },
  ],
};
