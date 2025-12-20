# 系統級變更檢查指引（System Change Verification Guide）

## 1. 文件總覽
- **適用情境**：凡涉及 `docker-compose.yml`、環境變數、資料庫 schema/migration、FastAPI 後端模組（`auth.py`, `models.py`, `schemas.py`, `services.py`）、核心 React 狀態或共用元件（`store.ts`, `authStore.ts`, `components/`, `pages/`）的程式碼變更。
- **必須執行完整流程的時機**：
  - 準備送出 PR 或合併到 `main` 前。
  - 任何跨層（DB ↔ Backend ↔ Frontend ↔ Auth）或多模組同時變更。
  - 導入新服務、調整部署參數、更新登入/授權流程、調整資料模型欄位意義時。
  - 針對事故修復、性能調優、或使用者體驗重大調整後的驗證階段。

## 2. 變更類型分類
1. **系統級設定變更**：`docker-compose.yml`、Dockerfile、`env` 檔、啟動腳本。
2. **資料庫相關變更**：`models.py`, `migration_*.sql`, `db.py`, schema 說明文件。
3. **後端 API / 商業邏輯變更**：`main.py`, `services.py`, `schemas.py`, 任何 FastAPI router。
4. **前端核心狀態或共用元件變更**：`store.ts`, `authStore.ts`, `pages/*`, `components/*`, `widgets/*`.
5. **Auth / 權限 / 角色流程變更**：`auth.py`, token 邏輯、角色判斷、前端 Route 守門、`authStore.ts`.

## 3. 各類變更檢查清單

### 3.1 系統級設定變更
- **應檢查組件**：`docker-compose.yml`, `.env*`, `backend/Dockerfile`, `frontend/vite.config.ts`, `check_env.sh`.
- **檢查項目**：
  - [ ] 服務名稱、port、volume、network 是否與文件及其他環境一致（避免 CI/CD 無法啟動）。
  - [ ] 新增或修改的環境變數是否在後端 `settings` 或前端 `import.meta.env` 中讀取、並提供預設值。
  - [ ] `VITE_API_BASE`, `BACKEND_PORT` 等參數調整後，檢查前後端請求 URL 是否一致。
  - [ ] Docker 映像變動是否需要重新建置、緩存清除或增補建置指令。
  - [ ] `depends_on` 與健康檢查順序是否覆蓋新依賴（例如 backend 加入 message queue）。
- **未檢查可能後果**：部署失敗、服務無法互通、意外使用舊環境設定，導致資料讀寫錯誤或 API time-out。

### 3.2 資料庫相關變更
- **應檢查組件**：`models.py`, `db.py`, SQL migration, `schemas.py`, `services.py`, 受影響的前端表單/列表。
- **檢查項目**：
  - [ ] migration 與 ORM 模型欄位一一對齊（型別、nullable、預設值）。
  - [ ] `schemas.py` 的 Pydantic model 是否更新，避免 FastAPI response schema 不一致。
  - [ ] `services.py` 內部 CRUD 是否調整欄位映射、交易與錯誤處理。
  - [ ] 前端提交資料是否包含新欄位，或在 UI 上處理缺少欄位的 backward compatibility。
  - [ ] 現有資料是否需要 backfill，是否存在 null/constraint 造成的啟動失敗。
  - [ ] `db.py` 連線/Session 管理是否因 schema 變更需要調整（如加大 pool）。
- **未檢查可能後果**：API 500、資料遺失或無法序列化、舊資料造成 migration 失敗、前端顯示空白或崩潰。

### 3.3 後端 API / 商業邏輯變更
- **應檢查組件**：`main.py` router、`services.py`, `schemas.py`, 單元測試/整合測試、前端呼叫這些 API 的頁面與 `store.ts`.
- **檢查項目**：
  - [ ] 新增/調整的 endpoint 有相對應 schema、驗證與對應 service 層。
  - [ ] 負責操作的 `services` 方法在交易/錯誤處理/邊界條件上都有更新。
  - [ ] 影響的前端頁面（如 `TeacherCohort`, `EvidenceCreateDialog`）是否更新 API URL、HTTP method、payload。
  - [ ] 回應格式變化是否在前端解析器、`store.ts` 中同步更新，避免 undefined 欄位。
  - [ ] 相關授權（Role 檢查）、快取、排程任務是否需要同步調整。
  - [ ] 若依賴外部服務（PDF 處理、AI 模組），需在 docker image 或 env 調整對應設定。
- **未檢查可能後果**：API 套件版本不兼容、前端拿到舊格式導致不可用、背景任務持續寫入錯誤資料、權限穿透。

### 3.4 前端核心狀態或共用元件變更
- **應檢查組件**：`store.ts`, `authStore.ts`, `pages/*`, `components/*`, `hooks/useAutoSave.ts`, `widgets/*`.
- **檢查項目**：
  - [ ] Global store state shape 是否改變，並同步更新使用該 state 的所有 selector/hook。
  - [ ] 重要元件（例如 `ChatMainPanel`, `EvidenceListPanel`）在 props、context、async flow 變更後是否有 loading/error fallback。
  - [ ] 路由（`App.tsx`, `pages/`）與權限守門邏輯是否對應新狀態。
  - [ ] 若牽涉檔案上傳、PDF顯示，需檢查跨瀏覽器與大型檔案的行為。
  - [ ] Storybook/單元測試/型別定義（`types.ts`）是否更新。
- **未檢查可能後果**：頁面崩潰、狀態不同步造成資料遺失、權限頁面顯示錯誤內容、TypeScript 編譯錯誤。

### 3.5 Auth / 權限 / 角色流程變更
- **應檢查組件**：`backend/auth.py`, `services.py` 的角色判斷、`schemas.py` 的 token payload、前端 `authStore.ts`, `LoginPage`, `TeacherHome`, `StudentHome`, Route Guard。
- **檢查項目**：
  - [ ] Token 生成/驗證（過期時間、簽章、claim）是否同步改動，並確保前端 refresh/儲存策略一致。
  - [ ] 角色列表與權限矩陣（teacher/student/admin）是否於後端 service、前端路由雙邊更新。
  - [ ] 錯誤處理：未授權、token 過期時的轉向/提示。
  - [ ] Session/state 清除流程（登出、token refresh 失敗）是否覆蓋所有儲存位置（localStorage/store）。
  - [ ] 若新增流程（如 2FA、單點登入），需檢查 docker/network 是否允許相關 callback。
- **未檢查可能後果**：未授權存取、永久登入失效、使用者被錯誤導至錯誤頁、資料洩漏。

## 4. 跨層影響檢查（Critical）
- **Backend ↔ Frontend**：每個調整的 endpoint 都要對應一次端對端測試，確認 HTTP method、路由、payload、錯誤碼完全一致。
- **Schema ↔ Pydantic ↔ API Response ↔ UI**：當欄位新增/移除/型別改變時，須同步更新 migration → ORM → Pydantic → Response serializer → 前端資料模型，確保 UI 不會顯示 `undefined` 或送出錯 payload。
- **Auth 狀態 ↔ Store ↔ Route/Page**：任何 token 或角色結構調整，必須逐頁檢查：登入流程、重新導向、保護路由、前端 store 初始化、錯誤提示、登出流程。
- **部署設定 ↔ 執行時行為**：Docker 或 env 調整後，需檢查以 Postgres 為例的連線字串、volume 持久化、備援策略是否生效。

## 5. 建議檢查順序
1. **環境與設定**：確認 `docker-compose up` 可成功啟動所有服務；`check_env.sh` 無錯。
2. **資料層**：執行/驗證 migration，在本地與 staging DB 各跑一次，並檢查資料完整性。
3. **後端 API**：跑單元測試、以 Postman/HTTPie/自動化測試逐一驗證受影響的 endpoint（含錯誤情境）。
4. **前端整合**：以實際角色登入，覆蓋受影響頁面與關鍵互動（建立/更新 evidence、查看 cohort、聊天、PDF 標註）。
5. **跨層情境**：模擬多角色切換、token 過期、離線重載等複合情境。
6. **回歸檢查**：與 QA/產品確認核心使用旅程（Teacher workflow、Student workflow、登入、資料瀏覽）均無退化。

## 6. 常見踩雷與反模式
- 忽略 Pydantic schema 更新，導致 FastAPI response 仍回舊欄位或型別不符。
- 只修改 `store.ts` 而未更新使用該 state 的 selector，導致 runtime `undefined`.
- Migration 未考慮既有資料（未設定預設值或 backfill），造成啟動即失敗。
- 調整 Docker port/環境變數時未同步 `VITE_API_BASE`，前端落到錯誤 API URL。
- 誤以為角色判斷只在前端進行，忽略後端 service 的權限檢查，造成繞過。
- 忘記更新文件與 `.env.example`，使得其他開發者無法重現環境。

## 7. 文件使用方式建議
- **閱讀時機**：在規劃變更時先瀏覽一次，於開發完成後逐項勾檢；PR 審查或發版前再快速回顧。
- **PR / Code Review 基準**：Reviewer 應以本指引為核對清單，要求開發者提供相關驗證證據（log、截圖、測試結果）。
- **知識傳承**：可納入 `README` 或 `docs/`，並在新人 onboarding、變更審查會議中引用。
- **持續維護**：每次出現新型態變更或事故時，更新本文件以反映最新教訓，確保系統級穩定性。



