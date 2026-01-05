import type { TourConfig } from '../../tourStore';

export const literatureTour: TourConfig = {
  id: 'literature-upload',
  title: '文獻庫導覽',
  description: '學習如何上傳和管理您的研究文獻',
  steps: [
    {
      target: '[data-tour="upload-button"]',
      title: '上傳文獻',
      description:
        '點擊此按鈕可以上傳 PDF 或文字檔案。上傳後，系統會自動進行 RAG 處理，讓 AI 能夠理解文獻內容。',
      placement: 'bottom',
      spotlightShape: 'rect',
      highlightPulse: true,
    },
    {
      target: '[data-tour="upload-dropzone"]',
      title: '拖放上傳區域',
      description:
        '點擊此區域可選擇檔案，或直接拖曳 PDF/TXT 檔案到此處。系統支援最大 25MB 的檔案。',
      placement: 'bottom',
      spotlightShape: 'rect',
      highlightPulse: true,
    },
    {
      target: '[data-tour="document-title-input"]',
      title: '為文獻命名',
      description: '輸入文獻標題（如作者名稱、論文主題），幫助您後續快速識別和搜尋文獻。',
      placement: 'top',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="confirm-upload-button"]',
      title: '確認上傳',
      description:
        '點擊此按鈕完成上傳。上傳後系統會自動進行 RAG 處理，這個過程通常需要 30 秒至 2 分鐘。',
      placement: 'bottom',
      spotlightShape: 'rect',
      highlightPulse: true,
    },
    {
      target: '[data-tour="search-bar"]',
      title: '搜尋文獻',
      description: '使用搜尋框可以快速找到您需要的文獻。支援按文件名稱和上傳日期搜尋。',
      placement: 'bottom',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="document-list"]',
      title: '文獻列表',
      description:
        '這裡顯示您所有上傳的文獻。每個文獻卡片會顯示處理狀態：準備中、處理中、完成或失敗。',
      placement: 'top',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="document-card-example"]',
      title: '文獻卡片信息',
      description:
        '每個卡片顯示：文獻類型（PDF/TXT）、標題、上傳日期和檔案大小。您可以懸停查看預覽或刪除選項。',
      placement: 'left',
      spotlightShape: 'rect',
    },
    {
      target: '[data-tour="rag-status-badge"]',
      title: 'RAG 處理狀態',
      description:
        '狀態標籤顯示 AI 處理進度：✓ 完成、⏳ 處理中、✗ 失敗。處理完成後，AI 能夠精確理解文獻內容。',
      placement: 'right',
      spotlightShape: 'rect',
    },
    {
      target: 'body',
      title: '完成！',
      description: '上傳文獻後，您可以在專案工作區中將文獻綁定到專案，開始閱讀和標記重點。',
      placement: 'center',
      spotlightShape: 'none',
    },
  ],
};
