# ThesisFlow Workflow 移除 - 實施清單

**開始日期**: 2026-01-15
**目標**: 完整移除 Workflow 系統，保留固定的 Summary 和 Comparison 任務表單

---

## 🎯 修復遺漏的問題（優先級：高）

### Task 1.1: 刪除 TeacherInterface.tsx
- **檔案**: `frontend/components/TeacherInterface.tsx` (892 行)
- **內容**: 完整的 React Flow 視覺設計器
- **問題**: 應在階段 3 移除，但被遺漏
- **狀態**: ⏳ 待開始
- **步驟**:
  1. [ ] 確認無其他檔案導入此組件（除了 App.tsx）
  2. [ ] 刪除該檔案

### Task 1.2: 從 App.tsx 移除 /teacher/designer 路由
- **檔案**: `frontend/App.tsx`
- **位置**: 第 117-122 行
- **內容**:
  ```typescript
  <Route
    path="/teacher/designer"
    element={
      <ProtectedRoute requiredRole="teacher">
        <TeacherInterface />
      </ProtectedRoute>
    }
  />
  ```
- **狀態**: ⏳ 待開始
- **步驟**:
  1. [ ] 移除整個路由 block
  2. [ ] 驗證 `/teacher/designer` 不再可訪問

### Task 1.3: 驗證修復
- **測試目標**: 確保 `/teacher` 不再有 workflow 功能
- **步驟**:
  1. [ ] 編譯前端 (npm run build)
  2. [ ] 啟動服務 (npm run dev)
  3. [ ] 訪問 http://localhost:3000/teacher - 應只顯示 TeachingFlowSection
  4. [ ] 驗證導航按鈕指向 `/teacher/config`

---

## 📋 階段 3: 完成學生端介面整合

### Task 2.1: 建立 TasksPanel.tsx 主組件
- **檔案**: `frontend/components/student/TasksPanel.tsx` (新建)
- **功能**:
  - 根據 task_config 決定顯示哪些任務
  - 如果兩個任務都啟用，顯示標籤切換
  - 如果只有一個任務，直接顯示
- **主要結構**:
  ```typescript
  interface TasksPanelProps {
    projectId: string;
    config: TaskConfig;
  }

  export function TasksPanel({ projectId, config }: TasksPanelProps) {
    const [activeTab, setActiveTab] = useState<'summary' | 'comparison'>('summary');

    // 根據 config 決定啟用的任務
    const enabledTasks = [
      config.summary.enabled && 'summary',
      config.comparison.enabled && 'comparison'
    ].filter(Boolean);

    // 標籤切換（多任務時顯示）
    // 任務內容渲染
  }
  ```
- **狀態**: ⏳ 待開始
- **步驟**:
  1. [ ] 建立文件結構
  2. [ ] 實現任務啟用邏輯
  3. [ ] 實現標籤切換 UI
  4. [ ] 實現任務內容渲染邏輯

### Task 2.2: 建立 SummaryTaskWidget.tsx
- **檔案**: `frontend/components/student/SummaryTaskWidget.tsx` (新建)
- **功能**: 包裝現有 SectionWriter 邏輯，不依賴 currentNode
- **主要變更**:
  - 使用固定 nodeId: 'summary'
  - 從 config.summary.sections 讀取段落配置
  - 所有邏輯與原 StudentInterface 中的 task_summary 區塊相同
- **狀態**: ⏳ 待開始
- **步驟**:
  1. [ ] 從 StudentInterface.tsx 中提取 summary 任務邏輯
  2. [ ] 適應新的 task_config 結構
  3. [ ] 移除 currentNode 依賴
  4. [ ] 測試編譯和功能

### Task 2.3: 建立 ComparisonTaskWidget.tsx
- **檔案**: `frontend/components/student/ComparisonTaskWidget.tsx` (新建)
- **功能**: 包裝現有 MatrixCompare 邏輯，不依賴 currentNode
- **主要變更**:
  - 使用固定 nodeId: 'comparison'
  - 從 config.comparison.dimensions 讀取維度配置
  - 所有邏輯與原 StudentInterface 中的 task_comparison 區塊相同
- **狀態**: ⏳ 待開始
- **步驟**:
  1. [ ] 從 StudentInterface.tsx 中提取 comparison 任務邏輯
  2. [ ] 適應新的 task_config 結構
  3. [ ] 移除 currentNode 依賴
  4. [ ] 測試編譯和功能

### Task 2.4: 更新 StudentInterface.tsx
- **檔案**: `frontend/components/StudentInterface.tsx` (2949 行)
- **修改項目**:

  **移除 (第 789-846 行)**:
  - [ ] 移除 `renderNavigationButtons()` 函數
  - [ ] 移除所有導航按鈕渲染邏輯（上一步/下一步）
  - [ ] 移除導航相關的 UI 元素

  **移除依賴**:
  - [ ] 移除 currentNode 相關邏輯
  - [ ] 移除 currentStepId 依賴
  - [ ] 移除 navigateNext/navigatePrev 的呼叫

  **新增整合**:
  - [ ] 導入 TasksPanel、SummaryTaskWidget、ComparisonTaskWidget
  - [ ] 在第四個面板位置替換原有的條件式 widget 渲染
  - [ ] 傳入 activeProject?.task_config 到 TasksPanel
  - [ ] 測試所有面板的渲染

- **狀態**: ⏳ 待開始
- **影響的面板**:
  1. LibraryPanel - ✅ 保留不變
  2. ReaderPanel - ✅ 保留不變
  3. ChatMainPanel - ✅ 保留不變
  4. TasksPanel - ⚠️ 需要用新的 TasksPanel 替換
  5. EvidenceListPanel - ✅ 保留不變

### Task 2.5: 更新 projectService.ts
- **檔案**: `frontend/services/projectService.ts`
- **新增方法**:
  ```typescript
  async saveTaskState(projectId: string, payload: {
    project_id: string;
    summary_state: Record<string, any>;
    comparison_state: any[];
  }): Promise<void>

  async loadTaskState(projectId: string): Promise<TaskStateOut | null>
  ```
- **更新方法**:
  - [ ] 確保 saveProject 和 updateProject 支援 task_config 參數
  - [ ] 測試 API 呼叫
- **狀態**: ⏳ 待開始

### Task 2.6: 階段 3 驗證
- **測試目標**: 學生端功能完整
- **步驟**:
  1. [ ] 編譯前端無錯誤
  2. [ ] 啟動前端服務
  3. [ ] 訪問 /student/project
  4. [ ] 驗證 TasksPanel 正確顯示
  5. [ ] 驗證摘要任務功能正常
  6. [ ] 驗證比較任務功能正常
  7. [ ] 驗證 Evidence 系統正常
  8. [ ] 驗證自動儲存正常
  9. [ ] 驗證 AI 聊天正常

---

## 🧹 階段 4: 清理與後端遷移

### Task 3.1: 移除 React Flow 依賴
- **檔案**: `frontend/package.json`
- **步驟**:
  1. [ ] 檢查 reactflow 是否還被其他檔案使用（grep 搜尋）
  2. [ ] 如果完全未使用，從 package.json 移除
  3. [ ] 執行 npm install 更新依賴
- **狀態**: ⏳ 待開始

### Task 3.2: 後端模型清理
- **檔案**: `backend/models.py`
- **步驟**:
  1. [ ] 檢查 FlowNode 表是否還有資料被引用
  2. [ ] 檢查 FlowEdge 表是否還有資料被引用
  3. [ ] 驗證遷移腳本已將所有資料轉移到 task_config
  4. [ ] 備份這些表（SQL dump）
  5. [ ] 從 models.py 中移除 FlowNode 和 FlowEdge 類定義
- **狀態**: ⏳ 待開始

### Task 3.3: 後端路由清理
- **檔案**: `backend/routes/projects.py` 和 `backend/routes/workflow.py`
- **步驟**:
  1. [ ] 檢查是否還有使用舊 flow_nodes/flow_edges 的邏輯
  2. [ ] 移除或更新過時的端點
  3. [ ] 驗證新的 task-state 端點工作正常
- **狀態**: ⏳ 待開始

### Task 3.4: 執行數據庫遷移（生產前）
- **步驟**:
  1. [ ] 備份生產資料庫
  2. [ ] 在測試環境執行遷移腳本
  3. [ ] 驗證所有專案都有有效的 task_config
  4. [ ] 驗證舊 FlowNode/FlowEdge 資料已妥善保存
  5. [ ] 在生產環境執行遷移（使用者同意下）
- **狀態**: ⏳ 待開始

---

## 📚 文檔更新

### Task 4.1: 更新 CLAUDE.md
- **檔案**: `/Users/hsueh/Code/thesisflow-ai-flow/CLAUDE.md`
- **更新項目**:
  - [ ] 移除 React Flow 相關文檔
  - [ ] 更新 Frontend Routes (Teacher) 部分，移除 `/teacher/project/:id` 路由
  - [ ] 新增 `/teacher/config` 和 `/teacher/config/:id` 路由說明
  - [ ] 更新 Architecture 部分中的 React Flow 引用
  - [ ] 更新 State Management Pattern 中的 workflow 相關內容
  - [ ] 新增 TaskConfig 結構說明
- **狀態**: ⏳ 待開始

### Task 4.2: 更新 README.md
- **檔案**: 如果存在
- **步驟**:
  1. [ ] 更新任何 workflow 相關的說明
  2. [ ] 更新功能列表中的任務配置部分
- **狀態**: ⏳ 待開始

### Task 4.3: 建立遷移完成報告
- **檔案**: `docs/MIGRATION_COMPLETE.md`
- **內容**:
  - [ ] 遷移摘要
  - [ ] 已移除的功能清單
  - [ ] 新增的功能清單
  - [ ] API 變更清單
  - [ ] 資料庫變更清單
  - [ ] 已知限制和注意事項
- **狀態**: ⏳ 待開始

---

## ✅ 最終驗證

### Task 5.1: 編譯驗證
- [ ] `npm run build` 成功編譯
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告（或已標註）
- [ ] 無構建警告

### Task 5.2: 服務驗證
- [ ] 後端服務啟動成功
- [ ] 前端服務啟動成功
- [ ] 兩個服務無錯誤日誌

### Task 5.3: 功能驗證
- [ ] 教師可以訪問 `/teacher`
- [ ] 教師可以訪問 `/teacher/config` 建立/編輯專案
- [ ] 教師無法訪問 `/teacher/designer`（已刪除）
- [ ] 學生可以訪問 `/student/project`
- [ ] 學生可以看到啟用的任務
- [ ] 摘要任務功能完整
- [ ] 比較任務功能完整
- [ ] Evidence 系統正常
- [ ] AI 聊天正常
- [ ] 文檔上傳和綁定正常
- [ ] 自動儲存正常

### Task 5.4: 端對端流程測試
- [ ] 教師：建立專案 → 配置任務 → 保存
- [ ] 學生：進入專案 → 查看任務配置 → 執行摘要任務 → 執行比較任務 → 查看 AI 反饋
- [ ] 多個專案之間切換正常
- [ ] 跨會話狀態持久化正常

---

## 📊 進度追蹤

| 階段 | 任務 | 狀態 | 完成時間 |
|------|------|------|---------|
| 修復 | Task 1.1 - 刪除 TeacherInterface | ⏳ | - |
| 修復 | Task 1.2 - 移除路由 | ⏳ | - |
| 修復 | Task 1.3 - 驗證 | ⏳ | - |
| 3 | Task 2.1 - TasksPanel | ⏳ | - |
| 3 | Task 2.2 - SummaryTaskWidget | ⏳ | - |
| 3 | Task 2.3 - ComparisonTaskWidget | ⏳ | - |
| 3 | Task 2.4 - StudentInterface 更新 | ⏳ | - |
| 3 | Task 2.5 - projectService 更新 | ⏳ | - |
| 3 | Task 2.6 - 驗證 | ⏳ | - |
| 4 | Task 3.1 - 移除依賴 | ⏳ | - |
| 4 | Task 3.2 - 後端模型清理 | ⏳ | - |
| 4 | Task 3.3 - 後端路由清理 | ⏳ | - |
| 4 | Task 3.4 - 數據庫遷移 | ⏳ | - |
| 文檔 | Task 4.1 - 更新 CLAUDE.md | ⏳ | - |
| 文檔 | Task 4.2 - 更新 README | ⏳ | - |
| 文檔 | Task 4.3 - 遷移報告 | ⏳ | - |
| 驗證 | Task 5.1-5.4 | ⏳ | - |

---

**下一步**: 開始 Task 1.1 - 刪除 TeacherInterface.tsx
