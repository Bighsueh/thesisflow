# Docker 部署文檔

本文檔說明如何使用 Docker Compose 部署 ThesisFlow 系統。

## 系統架構

系統包含三個 Docker 服務：

- **前端** (React + Vite + nginx)：port 3000
- **後端** (FastAPI + Python)：port 8000
- **資料庫** (PostgreSQL 16)：port 5432

## 前置需求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用記憶體

## 快速開始

### 1. 複製環境變數檔案

```bash
cp .env.example .env
```

### 2. 配置環境變數

根據您的部署環境（開發或生產），編輯 `.env` 檔案並填入適當的值。

### 3. 啟動服務

```bash
docker compose up -d
```

### 4. 檢查服務狀態

```bash
docker compose ps
```

### 5. 查看日誌

```bash
# 查看所有服務日誌
docker compose logs -f

# 查看特定服務日誌
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres
```

### 6. 停止服務

```bash
docker compose down
```

### 7. 停止並刪除資料（包括資料庫）

```bash
docker compose down -v
```

## 環境變數配置

### 開發環境配置

在 `.env` 檔案中，**不需要填寫** `FRONTEND_DOMAIN` 和 `BACKEND_DOMAIN`，系統會自動使用 localhost：

```env
# 前端配置
VITE_API_BASE=http://localhost:8000
FRONTEND_DOMAIN=
FRONTEND_PORT=3000

# 後端配置
BACKEND_DOMAIN=
BACKEND_PORT=8000

# 其他配置...
MINIO_ENDPOINT=your-minio-endpoint:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=your_bucket
MINIO_USE_SSL=false

AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview

JWT_SECRET=your-secret-key-change-this
```

**開發環境特點：**

- 前端：`http://localhost:3000`
- 後端：`http://localhost:8000`
- CORS 自動允許 localhost 來源

### 生產環境配置

在 `.env` 檔案中，**必須填寫** `FRONTEND_DOMAIN` 和 `BACKEND_DOMAIN`：

```env
# 前端配置
# 如果使用 Cloudflare Tunnel，填寫您的 domain
VITE_API_BASE=https://api.yourdomain.com
# 或使用 Docker 內部網路（推薦）
# VITE_API_BASE=http://backend:8000

FRONTEND_DOMAIN=https://yourdomain.com
FRONTEND_PORT=3000

# 後端配置
BACKEND_DOMAIN=https://api.yourdomain.com
BACKEND_PORT=8000

# 其他配置...
MINIO_ENDPOINT=your-minio-endpoint:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=your_bucket
MINIO_USE_SSL=true

AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview

JWT_SECRET=your-strong-secret-key-change-this-in-production
```

**生產環境特點：**

- 前端：使用設定的 `FRONTEND_DOMAIN`（例如：`https://yourdomain.com`）
- 後端：使用設定的 `BACKEND_DOMAIN`（例如：`https://api.yourdomain.com`）
- CORS 自動允許設定的 domain
- 建議使用 HTTPS

### Cloudflare Tunnel 配置範例

如果您使用 Cloudflare Tunnel（cloudflared）將服務暴露到 port 443：

```env
# 前端配置
VITE_API_BASE=https://api.yourdomain.com
FRONTEND_DOMAIN=https://yourdomain.com
FRONTEND_PORT=3000

# 後端配置
BACKEND_DOMAIN=https://api.yourdomain.com
BACKEND_PORT=8000
```

在 Cloudflare Tunnel 配置中：

- 前端：`https://yourdomain.com` → `localhost:3000`
- 後端：`https://api.yourdomain.com` → `localhost:8000`

## 資料庫管理

### 初始化資料庫 Schema

資料庫 schema 會在後端服務啟動時自動建立。後端使用 SQLAlchemy 的 `Base.metadata.create_all()` 自動建立所有必要的表格。

### 自動 Migration

系統會在後端啟動時自動執行 migration。`db_migration.py` 中的 `auto_migrate_highlights_table()` 會自動檢查並添加缺少的欄位到 `highlights` 表格。

如果需要手動執行 migration，可以透過以下方式：

```bash
# 進入後端容器
docker compose exec backend bash

# 在容器內執行 Python migration 腳本
python -c "from db_migration import auto_migrate_highlights_table; auto_migrate_highlights_table()"
```

### 備份資料庫

```bash
# 備份
docker compose exec postgres pg_dump -U postgres thesisflow > backup.sql

# 還原
docker compose exec -T postgres psql -U postgres thesisflow < backup.sql
```

### 重置資料庫

```bash
# 停止服務並刪除資料卷
docker compose down -v

# 重新啟動（會自動建立新的資料庫）
docker compose up -d
```

## 常見問題

### 1. 前端無法連接到後端

**問題：** 前端顯示 CORS 錯誤或無法連接到 API。

**解決方案：**

- 檢查 `.env` 檔案中的 `VITE_API_BASE` 是否正確
- 檢查 `FRONTEND_DOMAIN` 是否正確設定（生產環境）
- 確認後端服務正在運行：`docker compose ps`
- 查看後端日誌：`docker compose logs backend`

### 2. 資料庫連接失敗

**問題：** 後端無法連接到資料庫。

**解決方案：**

- 確認資料庫服務正在運行：`docker compose ps`
- 檢查資料庫健康狀態：`docker compose logs postgres`
- 確認 `DATABASE_URL` 環境變數正確（Docker 環境應使用 `postgres` 作為主機名稱）

### 3. 端口已被占用

**問題：** 啟動時提示端口已被占用。

**解決方案：**

- 修改 `.env` 檔案中的端口配置：
  ```env
  FRONTEND_PORT=3001  # 改用其他端口
  BACKEND_PORT=8001   # 改用其他端口
  ```
- 或停止占用端口的其他服務

### 4. 建置失敗

**問題：** Docker 建置過程中出現錯誤。

**解決方案：**

- 清理 Docker 快取並重新建置：
  ```bash
  docker compose build --no-cache
  ```
- 檢查 Dockerfile 中的路徑是否正確
- 確認所有必要的檔案都存在

### 5. 環境變數未生效

**問題：** 修改 `.env` 檔案後，變數未生效。

**解決方案：**

- 重新啟動服務：
  ```bash
  docker compose down
  docker compose up -d
  ```
- 確認 `.env` 檔案位於專案根目錄
- 檢查環境變數名稱是否正確（區分大小寫）

### 6. Azure OpenAI 部署名稱錯誤

**問題：** 出現錯誤訊息「Azure OpenAI 部署 'gpt-4.1-mini' 不存在或無法訪問」。

**可能原因：**

1. **部署名稱不正確**：`gpt-4.1-mini` 只是範例名稱，您需要替換為您在 Azure OpenAI 中實際建立的部署名稱
2. **環境變數未正確設置**：Docker 容器中沒有正確讀取到環境變數
3. **部署名稱拼寫錯誤**：常見的 Azure OpenAI 部署名稱可能是 `gpt-4o-mini`、`gpt-4-turbo`、`gpt-35-turbo` 等

**解決方案：**

1. **確認您的 Azure OpenAI 部署名稱：**
   - 登入 [Azure Portal](https://portal.azure.com)
   - 前往您的 Azure OpenAI 資源
   - 在左側選單選擇「部署 (Deployments)」
   - 查看您實際建立的部署名稱（注意：部署名稱是您自己設定的，不一定與模型名稱相同）

2. **檢查環境變數是否正確傳入容器：**

   ```bash
   # 檢查後端容器的環境變數
   docker compose exec backend env | grep AZURE_OPENAI
   ```

   應該會顯示：

   ```
   AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com
   AZURE_OPENAI_API_KEY=your_api_key
   AZURE_OPENAI_DEPLOYMENT=your-actual-deployment-name
   AZURE_OPENAI_API_VERSION=2025-01-01-preview
   ```

3. **更新 `.env` 檔案：**

   ```env
   # 將部署名稱改為您在 Azure 中實際建立的部署名稱
   AZURE_OPENAI_DEPLOYMENT=your-actual-deployment-name
   ```

4. **重新啟動服務：**

   ```bash
   docker compose down
   docker compose up -d
   ```

5. **驗證配置：**
   - 檢查後端日誌：`docker compose logs backend`
   - 嘗試使用 AI 功能，確認錯誤訊息是否消失

**注意事項：**

- 部署名稱區分大小寫
- 部署名稱可能與模型名稱不同（例如：模型可能是 `gpt-4o-mini`，但部署名稱可能是 `my-gpt4-deployment`）
- 確保您的 Azure OpenAI 資源已啟用該模型，並且部署已成功建立

## 開發模式

如果您想在開發模式下運行（支援熱重載），可以：

1. **前端開發模式：**
   - 不使用 Docker，直接在本地運行：
     ```bash
     # 從根目錄
     npm run install:frontend
     npm run dev

     # 或進入 frontend 目錄
     cd frontend
     npm install
     npm run dev
     ```
   - 後端和資料庫仍使用 Docker

2. **後端開發模式：**
   - docker-compose.yml 中已設定 volume 掛載，修改後端程式碼會自動重載
   - 如需完全本地開發，可以修改 `backend/env.local` 使用本地資料庫

## 生產部署建議

1. **安全性：**
   - 使用強密碼的 `JWT_SECRET`
   - 使用 HTTPS（透過 Cloudflare Tunnel 或反向代理）
   - 定期更新 Docker 映像
   - 限制資料庫端口對外暴露（僅內部網路）

2. **效能：**
   - 使用 Docker 資源限制：
     ```yaml
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 2G
     ```
   - 設定適當的資料庫連接池大小
   - 使用 CDN 加速靜態資源

3. **監控：**
   - 設定日誌收集（例如：ELK Stack）
   - 監控服務健康狀態
   - 設定資料庫備份排程

4. **備份：**
   - 定期備份資料庫
   - 備份環境變數檔案（安全地）
   - 備份 Docker volumes

## 更新系統

```bash
# 1. 停止服務
docker compose down

# 2. 拉取最新程式碼
git pull

# 3. 重新建置映像
docker compose build --no-cache

# 4. 啟動服務
docker compose up -d

# 5. 檢查服務狀態
docker compose ps
docker compose logs -f
```

## 支援

如有問題，請檢查：

1. Docker 和 Docker Compose 版本
2. 系統資源（記憶體、磁碟空間）
3. 日誌輸出：`docker compose logs`
4. 服務狀態：`docker compose ps`

---

**最後更新**：2026-01-05
