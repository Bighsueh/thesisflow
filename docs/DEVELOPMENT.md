# 開發指南

這份文件給要在本機把 ThesisFlow 跑起來或修改程式碼的人。專案介紹請看 [README](../README.zh-TW.md)；正式環境部署與疑難排解請看 [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)。

## 前置需求

- Docker 20.10+ 與 Docker Compose 2.0+（建議方式）
- Node.js 18+、Python 3.11+（只有不用 Docker 開發時才需要）
- 一個 Azure OpenAI 部署（AI 對話與任務回饋會用到）
- 一個 S3 相容的 bucket，例如 MinIO（存放上傳的 PDF）
- 至少 2 GB 可用記憶體

## 用 Docker Compose 啟動

```bash
cp .env.example .env
# 編輯 .env，至少填入 Azure OpenAI、MinIO 與 JWT_SECRET

docker compose up -d        # 建置並啟動
docker compose ps           # 查看狀態
docker compose logs -f      # 查看日誌
```

| 服務       | 預設埠 | 說明                         |
| ---------- | ------ | ---------------------------- |
| `frontend` | 3000   | React 前端，由 nginx 提供    |
| `backend`  | 8000   | FastAPI 後端                 |
| `postgres` | 5432   | PostgreSQL 16                |

啟動後：

- 前端：http://localhost:3000
- 後端 API：http://localhost:8000
- Swagger UI：http://localhost:8000/docs（ReDoc 在 `/redoc`）
- 健康檢查：前端 `/health`、後端 `/health`

資料表由後端在啟動時自動建立，不需要另外跑初始化腳本。第一次使用時先註冊一個教師帳號，建立群組與專案，再用群組邀請碼以學生身分加入。

停止服務：

```bash
docker compose down         # 停止，保留資料
docker compose down -v      # 停止並刪除資料庫 volume
```

埠號被占用時，在 `.env` 改 `FRONTEND_PORT`、`BACKEND_PORT` 後重新啟動即可。

## 不用 Docker 的本地開發

資料庫仍可只用 Docker 起：

```bash
docker compose up -d postgres
```

### 前端

```bash
npm run install:frontend    # 從根目錄安裝前端依賴
npm run dev                 # 啟動 Vite dev server（預設 3000）
```

也可以進 `frontend/` 直接執行 `npm install`、`npm run dev`。前端依 `VITE_API_BASE` 連到後端。

### 後端

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp env.example env.local    # 填入實際值；DATABASE_URL 的主機用 localhost
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

後端啟動時會讀取 `backend/env.local`。在 Docker 裡，環境變數由 `docker-compose.yml` 傳入，`env.local` 只是備援。

### 混合模式

```bash
docker compose up -d postgres backend   # 只有前端在本機跑
docker compose up -d postgres           # 前後端都在本機跑
```

## 常用指令

從根目錄執行：

```bash
npm run dev            # 前端 dev server
npm run build          # 前端 production build
npm run lint           # ESLint
npm run lint:fix       # ESLint 自動修正
npm run format         # Prettier
npm run dev:backend    # 後端 dev server
```

`git commit` 時 Husky + lint-staged 會自動執行：TypeScript／JavaScript 跑 ESLint fix 與 Prettier，JSON／CSS／Markdown 只跑 Prettier。

目前沒有自動化測試。修改後的人工驗證步驟見 [SystemChangeVerificationGuide.md](SystemChangeVerificationGuide.md)。

## 環境變數

使用 Docker Compose 時，全部寫在專案根目錄的 `.env`。

### 前端

| 變數              | 說明                                  | 預設值                  |
| ----------------- | ------------------------------------- | ----------------------- |
| `VITE_API_BASE`   | 後端 API 位址，建置時注入             | `http://localhost:8000` |
| `FRONTEND_DOMAIN` | 前端網域，用於 CORS，正式環境必填     | 空                      |
| `FRONTEND_PORT`   | 前端服務埠                            | `3000`                  |

### 後端

| 變數                       | 說明                                   | 預設值        |
| -------------------------- | -------------------------------------- | ------------- |
| `DATABASE_URL`             | PostgreSQL 連線字串，Docker 下自動設定 | 見 compose 檔 |
| `BACKEND_DOMAIN`           | 後端網域，正式環境選填                 | 空            |
| `BACKEND_PORT`             | 後端服務埠                             | `8000`        |
| `AZURE_OPENAI_ENDPOINT`    | Azure OpenAI 端點                      | 無            |
| `AZURE_OPENAI_API_KEY`     | Azure OpenAI 金鑰                      | 無            |
| `AZURE_OPENAI_DEPLOYMENT`  | 部署名稱                               | 無            |
| `AZURE_OPENAI_API_VERSION` | API 版本                               | 無            |
| `MINIO_ENDPOINT`           | MinIO／S3 端點，格式為 `host:port`     | 無            |
| `MINIO_ACCESS_KEY`         | Access key                             | 無            |
| `MINIO_SECRET_KEY`         | Secret key                             | 無            |
| `MINIO_BUCKET`             | Bucket 名稱                            | 無            |
| `MINIO_USE_SSL`            | 是否使用 SSL                           | `false`       |
| `JWT_SECRET`               | JWT 簽章密鑰                           | `change-me`   |
| `DEBUG`                    | 設為 `true` 時 500 錯誤會附 traceback  | `false`       |

`.env.example` 裡的 `AZURE_EMBEDDING_*` 與 `CHROMA_*` 是已移除的 RAG 功能留下的，目前的程式不會讀取，可以留空。

瀏覽器會用 presigned URL 直接向 `MINIO_ENDPOINT` 讀取 PDF，所以這個位址必須是瀏覽器也連得到的，不能只在 Docker 網路內有效。

### 開發環境與正式環境的差別

- **開發環境：** `FRONTEND_DOMAIN`、`BACKEND_DOMAIN` 留空，CORS 自動放行 localhost。
- **正式環境：** 必須設定 `FRONTEND_DOMAIN`，CORS 只放行該來源；`JWT_SECRET` 換成至少 32 字元的隨機字串；全程使用 HTTPS。

## 資料庫變更

沒有使用 Alembic。新資料表由 SQLAlchemy 的 `create_all` 在啟動時建立；既有資料表的欄位變更寫成 SQL 檔放在 `backend/migrations/`，執行方式見該目錄的 [README](../backend/migrations/README.md)。

## 安全注意事項

- `.env`、`.env.local`、`backend/env.local` 都不得進版本控制，`.gitignore` 已排除。
- 正式環境不要對外開放資料庫埠。
- 註冊端點目前是開放的，而且可以指定角色；公開部署前需要先關閉或加上限制。
- 後端容器目前以 root 執行，正式環境建議改用非 root 使用者。
- 定期更新基礎映像（`python:3.11-slim`、`node:20-alpine`、`postgres:16`）與依賴套件。

## 相關文件

- [SITE_MAP.md](SITE_MAP.md)：路由與頁面地圖
- [TOUR_SYSTEM.md](TOUR_SYSTEM.md)：導覽系統
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)：部署設定、Cloudflare Tunnel、常見問題
- [AI_DOCUMENTATION_GUIDE.md](AI_DOCUMENTATION_GUIDE.md)：文件維護規則
