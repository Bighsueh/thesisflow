# ThesisFlow 導覽系統開發指南

## 目錄

1. [核心設計理念](#核心設計理念)
2. [設計系統一致性](#設計系統一致性)
3. [動畫配置指南](#動畫配置指南)
4. [如何新增導覽](#如何新增導覽)
5. [架構說明](#架構說明)
6. [注意事項與最佳實踐](#注意事項與最佳實踐)
7. [故障排除](#故障排除)

---

## 核心設計理念

### 1. 完全自製，無第三方依賴

ThesisFlow 的導覽系統是**完全自製**的，不依賴任何第三方導覽庫（如 Driver.js、Intro.js、Shepherd.js）。

**原因：**
- ✅ 完全掌控代碼和動畫質量
- ✅ 與現有 Framer Motion 動畫體系深度整合
- ✅ 沒有外部庫的限制和學習曲線
- ✅ 輕量級，只實現需要的功能

### 2. 配置驅動，易於擴展

所有導覽步驟都通過配置文件（`config/tours/*.ts`）定義，遵循"配置優於編程"的原則。

**好處：**
- ✅ 新增導覽無需修改核心代碼
- ✅ 非技術人員也能理解和修改步驟
- ✅ 配置文件可以視覺化或通過 UI 編輯（未來擴展）

### 3. 非侵入式整合

導覽系統通過 `data-tour` 屬性與現有組件整合，不修改核心業務邏輯。

**原則：**
- ✅ 只在目標元素加入 `data-tour="element-id"` 屬性
- ✅ 不修改組件的 state、props 或事件處理
- ✅ 使用 Portal 渲染 TourOverlay，與頁面內容隔離
- ✅ 獨立的 tourStore，不污染核心 store

### 4. 漸進式揭露

導覽步驟遵循"漸進式揭露"原則，從簡單到複雜，從整體到細節。

**設計模式：**
1. **第一步**：總覽（介紹整體佈局）
2. **中間步驟**：核心功能（逐一介紹主要面板和操作）
3. **最後步驟**：進階技巧（收合面板、快捷鍵等）

---

## 設計系統一致性

### 視覺語言規範

ThesisFlow 使用**玻璃態設計（Glassmorphism）**，所有導覽組件必須遵循以下規範：

#### 1. 玻璃態效果

**標準樣式：**
```css
bg-white/90 backdrop-blur-2xl border border-white/80
```

**應用場景：**
- TourTooltip（提示框）
- TourProgress（進度指示器）
- TourControls（控制按鈕）
- HelpCenter Modal

**錯誤示例：**
```css
/* ❌ 不要使用純色背景 */
bg-white

/* ❌ 不要使用不透明背景 */
bg-gray-100

/* ❌ 不要使用過度模糊 */
backdrop-blur-3xl
```

#### 2. 顏色規範

**主色調：紫色漸變**
- `violet-600` - 主要紫色
- `indigo-600` - 次要藍紫色
- `violet-500` - 高亮邊框、陰影發光
- `violet-400` - 當前步驟指示
- `violet-100` / `violet-200` - 淺色背景（HelpButton）

**應用場景：**
```typescript
// 高亮邊框
border-4 border-violet-500

// 發光陰影
shadow-violet-500/50

// 按鈕背景
bg-violet-600 hover:bg-violet-700

// 進度圓點（當前步驟）
bg-violet-400

// 進度圓點（已完成）
bg-violet-600
```

**禁止使用其他主色調：**
- ❌ 不要使用 `blue-*`（除非是次要信息）
- ❌ 不要使用 `green-*`（除了成功狀態）
- ❌ 不要使用 `red-*`（除了錯誤/刪除）

#### 3. 圓角規範

**大小規範：**
- `rounded-3xl` (24px) - 大卡片（HelpCenter Modal）
- `rounded-2xl` (16px) - 中等元素（TourTooltip、高亮區域）
- `rounded-xl` (12px) - 按鈕、小卡片
- `rounded-full` - 圓形按鈕（HelpButton）、進度圓點

**應用示例：**
```typescript
// HelpCenter Modal
className="rounded-3xl"

// TourTooltip
className="rounded-2xl"

// Button
className="rounded-xl"

// HelpButton
className="rounded-full"
```

#### 4. 陰影規範

**陰影層級：**
```typescript
// 主要陰影（Modal、Tooltip）
shadow-2xl shadow-violet-500/20

// 次要陰影（Progress、Controls）
shadow-xl shadow-violet-500/10

// 普通陰影
shadow-lg

// 發光效果（高亮邊框）
shadow-lg shadow-violet-500/50
```

**脈動動畫（吸引注意力）：**
```typescript
animate={{
  boxShadow: [
    '0 0 0 0 rgba(139, 92, 246, 0.7)',
    '0 0 0 20px rgba(139, 92, 246, 0)',
  ],
}}
transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
```

---

## 動畫配置指南

### 1. 動畫精緻度分級

ThesisFlow 導覽系統使用**兩級動畫精緻度**：

#### 電影級動畫（Landing Page）

**特點：**
- 分階段出場（stagger children）
- 彈性緩動（spring dynamics）
- 微動效（hover 旋轉、發光）

**配置示例：**
```typescript
// Stagger Container
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,  // 子元素間隔 150ms 出場
      delayChildren: 0.2,     // 延遲 200ms 開始
    },
  },
};

// Fade In Up with Spring
const fadeInUp = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      mass: 1,
    },
  },
};
```

#### 流暢現代動畫（其他頁面）

**特點：**
- 淡入淡出 + 縮放
- 彈性緩動
- 統一的過渡時間

**配置示例：**
```typescript
// 標準淡入
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// 滑動上升
export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// 彈性縮放
export const scaleSpring = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};
```

### 2. 統一動畫配置（config/animations.ts）

**所有動畫配置應該集中管理：**

```typescript
// frontend/config/animations.ts

// 彈性緩動（與現有系統一致）
export const spring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const smoothSpring = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 20,
};

// Custom cubic-bezier（平滑緩動）
export const easeOutQuart = [0.22, 1, 0.36, 1];

// 懸停效果（與 GlassCard 一致）
export const hoverEffect = {
  scale: 1.02,
  y: -4,
  transition: { duration: 0.2 },
};

export const tapEffect = {
  scale: 0.98,
};
```

### 3. Spotlight 動畫配置

**高亮區域過渡：**
```typescript
<motion.rect
  animate={{
    x: targetRect.left - 8,
    y: targetRect.top - 8,
    width: targetRect.width + 16,
    height: targetRect.height + 16,
  }}
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 30,
  }}
/>
```

**脈動效果：**
```typescript
<motion.div
  animate={{
    boxShadow: [
      '0 0 0 0 rgba(139, 92, 246, 0.7)',
      '0 0 0 20px rgba(139, 92, 246, 0)',
    ],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeOut',
  }}
/>
```

### 4. Tooltip 動畫配置

**進入動畫（根據位置反向彈出）：**
```typescript
const tooltipVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: placement === 'bottom' ? -10 : 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
      delay: 0.15,  // 等待 Spotlight 完成
    },
  },
};
```

**箭頭延遲出現：**
```typescript
const arrowVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.25, duration: 0.2 },
  },
};
```

### 5. 性能優化

**必須遵守的性能規範：**

1. **使用 will-change：**
```css
/* 對頻繁動畫的元素 */
.tour-spotlight {
  will-change: transform, opacity;
}
```

2. **useCallback 優化事件處理：**
```typescript
const handleNext = useCallback(() => {
  nextStep();
}, [nextStep]);
```

3. **Debounce resize 事件：**
```typescript
const updateRect = useMemo(
  () => debounce(() => {
    const element = document.querySelector(step.target);
    if (element) setTargetRect(element.getBoundingClientRect());
  }, 100),
  [step.target]
);
```

4. **避免在動畫中使用 filter：**
```css
/* ❌ 避免 */
filter: blur(10px);

/* ✅ 使用 */
backdrop-filter: blur(40px);  /* 在 backdrop 使用 */
```

---

## 如何新增導覽

### 步驟 1：創建導覽配置文件

在 `frontend/config/tours/` 創建新文件，例如 `myPageTour.ts`：

```typescript
import { TourConfig } from '../../tourStore';

export const myPageTour: TourConfig = {
  id: 'my-page-intro',  // 唯一 ID
  title: '我的頁面導覽',
  description: '學習如何使用我的頁面',
  icon: <MyIcon size={20} />,  // 可選：顯示在 HelpCenter
  iconBg: 'bg-blue-100',       // 可選：圖標背景顏色
  steps: [
    {
      target: '[data-tour="main-section"]',  // CSS selector
      title: '主要區域',
      description: '這是主要操作區域，您可以在此...',
      placement: 'right',                    // 提示框位置
      spotlightShape: 'rect',                // 高亮形狀（rect/circle/none）
      highlightPulse: true,                  // 是否顯示脈動效果
    },
    {
      target: '[data-tour="action-button"]',
      title: '操作按鈕',
      description: '點擊此按鈕可以...',
      placement: 'bottom',
      spotlightShape: 'circle',
      action: 'click',  // 自動觸發動作（可選）
    },
    // 更多步驟...
  ],
};
```

### 步驟 2：在頁面組件加入 data-tour 屬性

在目標頁面組件中，為需要高亮的元素加入 `data-tour` 屬性：

```typescript
// MyPage.tsx
export function MyPage() {
  return (
    <div>
      {/* 主要區域 */}
      <div data-tour="main-section" className="...">
        {/* 內容 */}
      </div>

      {/* 操作按鈕 */}
      <button data-tour="action-button" className="...">
        執行操作
      </button>
    </div>
  );
}
```

**注意事項：**
- ✅ 使用 kebab-case 命名（`main-section`，不是 `mainSection`）
- ✅ 確保 ID 唯一且具有描述性
- ✅ 不要在動態渲染的列表項上使用（除非是固定的第一項）

### 步驟 3：註冊導覽到索引文件

在 `frontend/config/tours/index.ts` 中註冊新導覽：

```typescript
import { dashboardTour } from './dashboardTour';
import { literatureTour } from './literatureTour';
import { myPageTour } from './myPageTour';  // 新增

export function getAllTours(): TourConfig[] {
  return [
    dashboardTour,
    literatureTour,
    myPageTour,  // 新增
    // 其他導覽...
  ];
}

// 根據路由獲取導覽 ID
export function getTourIdByPath(path: string): string | null {
  const tourMap: Record<string, string> = {
    '/dashboard': 'dashboard-intro',
    '/literature': 'literature-upload',
    '/my-page': 'my-page-intro',  // 新增
  };
  return tourMap[path] || null;
}
```

### 步驟 4：測試導覽

1. **手動觸發：**
   - 清除 localStorage 中的 `thesisflow_tour_completed`
   - 訪問對應頁面，導覽應該自動啟動
   - 或從 HelpCenter 點擊導覽卡片

2. **檢查清單：**
   - ✅ 所有步驟的 target 元素都存在
   - ✅ Spotlight 正確高亮目標
   - ✅ Tooltip 位置合理（不超出視窗）
   - ✅ 動畫流暢，無卡頓
   - ✅ 鍵盤快捷鍵可用（←/→/Esc）

---

## 架構說明

### 組件層級結構

```
App.tsx
└── TourProvider (Context Provider)
    ├── [現有頁面組件]
    │   └── [帶有 data-tour 屬性的元素]
    └── TourOverlay (Portal to document.body)
        ├── TourSpotlight (遮罩 + 高亮區域)
        ├── TourTooltip (提示框 + 箭頭)
        ├── TourProgress (進度指示器)
        └── TourControls (控制按鈕)
```

### 狀態管理流程

```
用戶操作
  ↓
TourControls (點擊「下一步」)
  ↓
tourStore.nextStep() (Zustand action)
  ↓
currentStep + 1
  ↓
TourOverlay 重新渲染
  ↓
讀取 currentTour.steps[currentStep]
  ↓
計算新的 targetRect
  ↓
TourSpotlight 動畫過渡到新位置
  ↓
TourTooltip 更新內容和位置
```

### localStorage 數據結構

```json
{
  "thesisflow_tour_completed": [
    "dashboard-intro",
    "literature-upload",
    "student-interface"
  ],
  "thesisflow_tour_visited_pages": [
    "/dashboard",
    "/literature",
    "/student/project"
  ],
  "thesisflow_tour_first_login": "true"
}
```

### 首次登入流程

```
用戶登入
  ↓
authStore.login()
  ↓
localStorage.setItem('thesisflow_token', ...)
  ↓
TourProvider useEffect 監聽 user 變化
  ↓
檢查 tourStore.isFirstLogin
  ↓
如果是首次登入：
  延遲 800ms → tourStore.startTour('dashboard-intro')
```

---

## 注意事項與最佳實踐

### 1. data-tour 屬性命名規範

**好的命名：**
- ✅ `data-tour="reader-panel"` - 描述性的，kebab-case
- ✅ `data-tour="upload-button"` - 明確指出元素類型
- ✅ `data-tour="first-project-card"` - 包含上下文

**不好的命名：**
- ❌ `data-tour="section1"` - 不具描述性
- ❌ `data-tour="readerPanel"` - 應使用 kebab-case
- ❌ `data-tour="btn"` - 過於簡短

### 2. 步驟數量建議

**最佳範圍：3-12 步**

- **太少（< 3 步）：** 可能無法充分介紹功能
- **太多（> 15 步）：** 用戶容易疲勞，跳過率高

**特殊情況：**
- **複雜頁面（如 StudentInterface）：** 可以到 12 步，但應分組介紹
- **簡單頁面（如 Profile）：** 2-3 步即可

### 3. 自動觸發動作

某些步驟可能需要自動觸發動作（如點擊按鈕展開面板）：

```typescript
{
  target: '[data-tour="library-toggle"]',
  title: '文獻庫面板',
  description: '點擊此按鈕展開文獻庫',
  action: 'click',  // 自動點擊按鈕
}
```

**在 TourOverlay 中監聽：**
```typescript
useEffect(() => {
  if (step.action === 'click' && step.target) {
    const element = document.querySelector(step.target);
    if (element) {
      setTimeout(() => {
        (element as HTMLElement).click();
      }, 300);
    }
  }
}, [step.action, step.target, currentStep]);
```

### 4. 避免遮擋重要元素

**問題：** Tooltip 可能遮擋下一步的目標元素

**解決方案：**
1. 使用智能位置計算（TourTooltip 已實現）
2. 調整 spotlight padding（加大高亮區域）
3. 調整步驟順序（先介紹上方元素，再介紹下方）

### 5. 響應式適配

**移動端注意事項：**
- ✅ Tooltip 寬度限制：`max-w-md`（移動端可能需要調整為 `max-w-sm`）
- ✅ 按鈕觸控區域：至少 44x44px
- ✅ 文字大小：不小於 14px

**響應式配置示例：**
```typescript
<motion.div
  className={`
    max-w-md md:max-w-lg
    text-sm md:text-base
  `}
>
  {/* Tooltip content */}
</motion.div>
```

### 6. 可訪問性（Accessibility）

**必須遵守的規範：**
- ✅ 鍵盤導航支援（←/→/Esc/Enter）
- ✅ 使用語義化標籤（`<button>`，不是 `<div>`）
- ✅ 提供 `aria-label`（如 HelpButton）
- ✅ 避免純色彩傳達信息（配合圖標或文字）

**實現示例：**
```typescript
<button
  aria-label="開啟幫助中心"
  onClick={...}
>
  <HelpCircle size={18} />
</button>
```

### 7. 性能優化清單

- ✅ 使用 `will-change` 提示瀏覽器優化
- ✅ Debounce resize 事件（100-150ms）
- ✅ 使用 `useCallback` 優化事件處理函數
- ✅ 避免在 render 中計算複雜邏輯（使用 `useMemo`）
- ✅ Portal 渲染到 `document.body`，避免受限於父容器

### 8. 測試清單

**功能測試：**
- ✅ 首次登入觸發 Dashboard 導覽
- ✅ 首次訪問頁面觸發該頁面導覽
- ✅ HelpButton 點擊開啟 HelpCenter
- ✅ HelpCenter 列出所有導覽及完成狀態
- ✅ 可以重播任何導覽
- ✅ 跳過按鈕正常工作
- ✅ 鍵盤快捷鍵可用
- ✅ localStorage 正確記錄進度

**視覺測試：**
- ✅ Spotlight 正確高亮目標元素
- ✅ Tooltip 位置不超出視窗
- ✅ 動畫流暢，60fps
- ✅ 玻璃態效果正確渲染
- ✅ 顏色符合設計規範

**兼容性測試：**
- ✅ Chrome/Firefox/Safari 測試
- ✅ 移動端瀏覽器測試（iOS Safari、Android Chrome）
- ✅ 不同視窗大小測試（resize）

---

## 故障排除

### 問題 1：目標元素未高亮

**可能原因：**
- 元素不存在（拼寫錯誤、動態渲染未完成）
- CSS selector 錯誤
- 元素被其他元素遮擋

**解決方案：**
1. 檢查 `data-tour` 屬性是否正確
2. 在 TourOverlay 中加入延遲：
```typescript
useEffect(() => {
  const updateRect = () => {
    const element = document.querySelector(step.target);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
    } else {
      console.warn(`[Tour] Target not found: ${step.target}`);
    }
  };

  setTimeout(updateRect, 100);  // 延遲確保元素已渲染
}, [step.target, currentStep]);
```

### 問題 2：Tooltip 超出視窗

**可能原因：**
- 位置計算函數未正確處理邊界
- 視窗太小

**解決方案：**
檢查 `calculateTooltipPosition` 函數，確保考慮了所有邊界情況：
```typescript
// 調整 Tooltip 位置使其不超出視窗
const x = Math.max(
  padding,
  Math.min(position.x, viewportWidth - tooltipSize.width - padding)
);
const y = Math.max(
  padding,
  Math.min(position.y, viewportHeight - tooltipSize.height - padding)
);
```

### 問題 3：動畫卡頓

**可能原因：**
- 未使用 `will-change`
- 在動畫中使用了 `filter` 或 `box-shadow`（CPU 密集）
- 未 debounce resize 事件

**解決方案：**
1. 加入 `will-change`：
```css
.tour-spotlight {
  will-change: transform, opacity;
}
```

2. 避免動畫高成本屬性：
```typescript
// ❌ 避免
<motion.div animate={{ filter: 'blur(10px)' }} />

// ✅ 使用
<motion.div animate={{ opacity: 0.5 }} />
```

3. Debounce resize：
```typescript
const updateRect = useMemo(
  () => debounce(() => { /* 更新邏輯 */ }, 100),
  [dependencies]
);
```

### 問題 4：首次登入導覽未觸發

**可能原因：**
- `isFirstLogin` 狀態未正確設置
- TourProvider 中的 useEffect 依賴項錯誤
- localStorage 中已有 `thesisflow_tour_first_login` 記錄

**解決方案：**
1. 清除 localStorage：
```javascript
localStorage.removeItem('thesisflow_tour_first_login');
localStorage.removeItem('thesisflow_tour_completed');
```

2. 檢查 TourProvider 的 useEffect：
```typescript
useEffect(() => {
  if (user && isFirstLogin && location.pathname === '/dashboard') {
    const timer = setTimeout(() => {
      startTour('dashboard-intro');
    }, 800);
    return () => clearTimeout(timer);
  }
}, [user, isFirstLogin, location.pathname]);  // 確保依賴項完整
```

### 問題 5：導覽無法重播

**可能原因：**
- HelpCenter 的 `startTour` 調用錯誤
- `completedTours` 狀態未正確管理

**解決方案：**
確保 HelpCenter 點擊導覽卡片時：
```typescript
<motion.div
  onClick={() => {
    onClose();  // 先關閉 HelpCenter
    setTimeout(() => {
      startTour(tour.id);  // 然後啟動導覽
    }, 300);
  }}
>
  {/* 導覽卡片 */}
</motion.div>
```

---

## 未來擴展方向

### 1. 多語言支援

**實現方式：**
- 導覽配置支援 i18n key
- 根據 `useAuthStore` 的用戶語言偏好切換

```typescript
// 配置文件
steps: [
  {
    target: '[data-tour="reader-panel"]',
    title: i18n.t('tour.student_interface.step1.title'),
    description: i18n.t('tour.student_interface.step1.description'),
  },
]
```

### 2. 視頻導覽

**實現方式：**
- 在 TourTooltip 中嵌入視頻
- 配置文件加入 `videoUrl` 字段

```typescript
{
  target: '[data-tour="reader-panel"]',
  title: 'PDF 閱讀器',
  description: '觀看視頻了解更多...',
  videoUrl: '/videos/reader-panel-intro.mp4',  // 新增
}
```

### 3. 互動式任務

**實現方式：**
- 要求用戶完成特定操作才能進入下一步
- 使用 MutationObserver 監聽 DOM 變化

```typescript
{
  target: '[data-tour="upload-button"]',
  title: '上傳文件',
  description: '請嘗試上傳一個 PDF 文件',
  requireAction: true,  // 新增：需要完成操作
  actionCheck: () => {
    // 檢查是否已上傳文件
    return document.querySelectorAll('.document-card').length > 0;
  },
}
```

### 4. Analytics 整合

**追蹤指標：**
- 導覽完成率
- 各步驟停留時間
- 跳過率最高的步驟
- 導覽後的功能使用率

**實現方式：**
```typescript
// 在 tourStore 中加入追蹤
nextStep: () => {
  const { currentStep, currentTourId } = get();

  // 追蹤步驟完成
  analytics.track('tour_step_completed', {
    tour_id: currentTourId,
    step: currentStep,
    timestamp: Date.now(),
  });

  set({ currentStep: currentStep + 1 });
},
```

---

## 總結

ThesisFlow 導覽系統是一個**完全自製、高度可定制、與設計系統完美融合**的解決方案。

**關鍵要點：**
- ✅ 遵循玻璃態設計語言（backdrop-blur、紫色主色調、統一圓角）
- ✅ 配置驅動，易於擴展新導覽
- ✅ 非侵入式整合（data-tour 屬性）
- ✅ 獨立狀態管理（tourStore）
- ✅ 性能優化（will-change、debounce、useCallback）
- ✅ 可訪問性（鍵盤導航、語義化標籤）

**開發流程：**
1. 創建導覽配置文件（`config/tours/*.ts`）
2. 在頁面組件加入 `data-tour` 屬性
3. 註冊導覽到索引文件（`config/tours/index.ts`）
4. 測試導覽（清除 localStorage，訪問頁面）

遵循本指南，您可以輕鬆為 ThesisFlow 新增高質量的導覽體驗！🎉
