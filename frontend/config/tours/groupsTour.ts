import type { TourConfig } from '../../tourStore';

export const groupsTour: TourConfig = {
  id: 'groups-join',
  title: '群組管理導覽',
  description: '學習如何加入和管理學生群組',
  steps: [
    {
      target: '[data-tour="join-group-form"]',
      title: '加入群組',
      description:
        '輸入授課教師提供的 9 位數群組代碼，即可加入群組。加入後您將獲得教師分配的專案流程。',
      placement: 'right',
      spotlightShape: 'rect',
      highlightPulse: true,
    },
    {
      target: '[data-tour="groups-list"]',
      title: '已加入的群組',
      description: '這裡顯示您已加入的所有群組。可以查看群組資訊、複製群組代碼（方便分享給同學）。',
      placement: 'left',
      spotlightShape: 'rect',
    },
    {
      target: 'body',
      title: '完成！',
      description: '加入群組後，教師會分配專案流程給您。前往「專案」頁面開始您的研究之旅！',
      placement: 'center',
      spotlightShape: 'none',
    },
  ],
};
