# 教師配置介面視覺化改進 - 實施總結

## 實施日期
2026-01-15

## 問題描述
原本的 `ProjectConfigEditor` 使用抽象的表單欄位，教師無法直觀預見學生端的呈現效果，造成配置上的認知負擔。

## 解決方案

### 1. 新增的組件

#### `SectionConfigCard.tsx`
- 視覺化的段落配置卡片
- 使用類似學生端 `SectionWriter` 的視覺設計
- 功能：
  - 展開/收合編輯模式
  - 視覺狀態指示（已配置/未配置）
  - 拖拽排序（上移/下移）
  - 刪除段落
  - 直接編輯標籤、提示文字、最少標記數

#### `ComparisonConfigPreview.tsx`
- 視覺化的比較任務配置
- 顯示類似學生端 `MatrixCompare` 的表格結構
- 功能：
  - 內聯編輯維度名稱
  - 預覽兩欄對比框架
  - 新增/刪除維度
  - 顯示相同點/不同點位置

#### `StudentPreviewPanel.tsx`
- 即時預覽面板，顯示學生實際看到的介面
- 功能：
  - 使用真實的 `SectionWriter` 和 `MatrixCompare` 組件
  - 提供 mock 資料模擬填寫狀態
  - 支援展開/收合以釋放編輯空間
  - 根據當前編輯的任務類型自動切換預覽

### 2. 重構的組件

#### `ProjectConfigEditor.tsx`
- 改為左右分欄響應式佈局（lg: 2/3 + 1/3）
- 新增任務類型切換 Tab（摘要/比較）
- 整合所有新組件
- 保留原有的儲存/取消功能

## 使用者體驗改進

### 改進前
- 需要在腦中想像配置效果
- 表單欄位抽象且不直觀
- 無法預見學生看到的樣子

### 改進後
- **視覺化配置**：直接在類似學生介面的卡片上編輯
- **即時預覽**：右側即時顯示學生視角
- **降低認知負擔**：所見即所得的設計理念
- **響應式設計**：大螢幕分欄，小螢幕堆疊

## 技術細節

### 組件結構
```
ProjectConfigEditor (主容器)
├── 基本資訊卡片
├── 左側配置區 (2/3)
│   ├── Tab 切換
│   ├── 摘要任務配置
│   │   └── SectionConfigCard[] (多個卡片)
│   └── 比較任務配置
│       └── ComparisonConfigPreview
└── 右側預覽區 (1/3)
    └── StudentPreviewPanel
        ├── SectionWriter (真實組件 + mock 資料)
        └── MatrixCompare (真實組件 + mock 資料)
```

### 資料流
1. 教師編輯配置 → 更新 `config` state
2. `config` 即時傳遞給 `StudentPreviewPanel`
3. 預覽面板使用真實組件渲染（mock 填寫資料）
4. 儲存時將完整 `config` 傳送至後端

## 檔案清單

### 新增檔案
- `frontend/components/teacher/SectionConfigCard.tsx`
- `frontend/components/teacher/ComparisonConfigPreview.tsx`
- `frontend/components/teacher/StudentPreviewPanel.tsx`

### 修改檔案
- `frontend/components/teacher/ProjectConfigEditor.tsx`

## 未來可能的改進

1. **拖拽排序**：加入拖放庫（react-dnd）實現更直觀的排序
2. **範本功能**：提供常用配置範本供快速套用
3. **複製段落**：允許複製現有段落以加速配置
4. **預覽模擬互動**：在預覽面板中允許模擬填寫以測試流程
5. **配置匯入/匯出**：支援 JSON 格式的配置分享

## 驗證步驟

1. 啟動前端開發伺服器
2. 以教師身份登入
3. 進入「建立新專案」或「編輯專案」頁面
4. 驗證左側配置區的卡片式介面
5. 驗證右側即時預覽功能
6. 測試新增/刪除/排序段落
7. 測試切換摘要/比較任務 Tab
8. 測試儲存功能

## 相容性

- 完全向後相容現有的專案配置結構
- 不影響學生端的任何功能
- 保留所有原有的表單驗證邏輯
