# 移除教學流程管理功能 - 重構總結

## 執行日期
2026-01-15

## 變更概述
將「教學流程管理」功能整合到「學生群組管理」中，並調整資料架構為：**一個群組可以有多個專案**。

## 架構變更

### 舊架構
```
Cohort (群組) --project_id--> Project (專案)
一對一關係
```

### 新架構
```
Project (專案) --cohort_id--> Cohort (群組)
多對一關係（一個群組可以有多個專案）
```

---

## 後端變更

### 1. 資料模型 (backend/models.py)
- ✅ Project 表新增 `cohort_id` 欄位（ForeignKey 到 Cohort）
- ✅ 更新 Project.cohort relationship（從 cohorts 改為 cohort）
- ✅ 更新 Cohort.projects relationship（新增，一對多）
- ✅ 保留 Cohort.project_id 以向後兼容（標記為 deprecated）

### 2. Schemas (backend/schemas.py)
- ✅ ProjectCreate 新增 `cohort_id` 欄位
- ✅ ProjectUpdate 新增 `cohort_id` 欄位
- ✅ ProjectOut 新增 `cohort_id` 欄位
- ✅ 保留 CohortOut.project_id（向後兼容）

### 3. API 路由 (backend/routes/projects.py)
- ✅ 新增 Query 參數支援按 `cohort_id` 過濾專案
- ✅ 建立專案時接受並儲存 `cohort_id`
- ✅ 更新專案時支援修改 `cohort_id`
- ✅ 學生端查詢邏輯：直接透過 `Project.cohort_id` 查詢
- ✅ 向後兼容：同時支援舊架構的 `Cohort.project_id`

### 4. Cohort 路由 (backend/routes/cohorts.py)
- ✅ 保持不變，繼續支援 `project_id` 欄位（向後兼容）

---

## 前端變更

### 1. UI 移除
- ✅ 刪除 `TeachingFlowSection.tsx` 組件
- ✅ 移除 TeacherSidebar 的「教學流程管理」導航項
- ✅ 更新類型定義：`'flows' | 'accounts' | 'groups'` → `'accounts' | 'groups'`
- ✅ TeacherHome 預設頁面改為「學生群組管理」

### 2. 類型與狀態管理
- ✅ types.ts: Project 介面新增 `cohort_id` 欄位
- ✅ store.ts: `loadProjects` 支援 `cohortId` 參數
- ✅ store.ts: `saveProject` 支援 `cohort_id` 欄位
- ✅ projectService: `loadProjects` 支援查詢參數

### 3. 群組詳情頁面 (CohortDetail.tsx)
- ✅ 移除「綁定教學流程」下拉選單
- ✅ 新增「群組專案」區塊，顯示該群組的所有專案
- ✅ 新增「建立新專案」按鈕
- ✅ 專案卡片包含：編輯、刪除功能
- ✅ 載入資料時按 cohortId 過濾專案

### 4. 專案配置編輯器 (ProjectConfigEditor.tsx)
- ✅ 接受 URL 查詢參數 `cohortId`
- ✅ 儲存專案時自動關聯到指定群組
- ✅ 儲存後返回群組詳情頁面（若有 cohortId）

### 5. 路由調整 (App.tsx)
- ✅ 保留 `/teacher/config` 和 `/teacher/config/:projectId` 路由
- ✅ 支援查詢參數：`/teacher/config?cohortId=xxx`

### 6. 學生端適配 (StudentInterface.tsx)
- ✅ 調整專案群組查詢邏輯（從 `c.project_id === activeProjectId` 改為透過 `project.cohort_id`）
- ✅ 後端自動處理學生端專案查詢（透過所屬群組的 cohort_id）

---

## 向後兼容性

1. **資料庫**
   - Cohort 表保留 `project_id` 欄位
   - 後端 API 繼續支援 `Cohort.project_id`

2. **API**
   - 學生端專案查詢同時支援新舊架構
   - 舊資料自動遷移到新架構

3. **前端**
   - 保留 Cohort 類型的 `project_id` 欄位
   - API 回應包含兩種關聯資訊

---

## 使用流程變更

### 舊流程
1. 教師在「教學流程管理」建立專案
2. 教師在「學生群組管理」建立群組
3. 教師在群組詳情中「綁定」一個專案

### 新流程
1. 教師在「學生群組管理」建立群組
2. 教師在群組詳情頁面直接「建立專案」
3. 一個群組可以建立多個專案
4. 學生加入群組後自動看到該群組的所有專案

---

## 測試檢查清單

- [ ] 教師可以在群組詳情頁面建立專案
- [ ] 教師可以編輯群組內的專案
- [ ] 教師可以刪除群組內的專案
- [ ] 一個群組可以有多個專案
- [ ] 學生加入群組後可以看到該群組的所有專案
- [ ] 向後兼容：舊的專案資料仍然可以正常存取
- [ ] 教師首頁預設顯示「學生群組管理」
- [ ] 側邊欄沒有「教學流程管理」選項

---

## 檔案清單

### 已修改的檔案
- backend/models.py
- backend/schemas.py
- backend/routes/projects.py
- frontend/types.ts
- frontend/store.ts
- frontend/services/projectService.ts
- frontend/components/teacher/TeacherSidebar.tsx
- frontend/pages/TeacherHome.tsx
- frontend/pages/TeacherCohort.tsx
- frontend/components/CohortDetail.tsx
- frontend/components/teacher/ProjectConfigEditor.tsx
- frontend/components/student/StudentInterface.tsx

### 已刪除的檔案
- frontend/components/teacher/TeachingFlowSection.tsx

---

## 注意事項

1. **資料遷移**：現有資料庫中的 Cohort.project_id 保持不變，新建專案會使用 Project.cohort_id
2. **UI 變更**：教師的工作流程發生變化，需要更新使用者文件
3. **權限控制**：學生端專案查詢已經自動適配新架構
4. **未來優化**：可考慮執行資料遷移腳本，將舊的 Cohort.project_id 關聯轉換為 Project.cohort_id
