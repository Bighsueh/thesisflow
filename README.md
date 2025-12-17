# ThesisFlow

<div align="center">

**基於 SALSA 框架的碩士論文文獻回顧雙循環學習系統**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 📖 簡介

ThesisFlow 是一個專為碩士論文文獻回顧設計的雙循環學習系統，基於 SALSA（Search, Appraisal, Synthesis, Analysis）框架。系統提供教師端和學生端雙重介面，幫助教師設計結構化的學習流程，並引導學生完成高品質的文獻回顧作業。

### 核心特色

- 🎯 **結構化學習流程**：基於 SALSA 框架設計的任務流程
- 👨‍🏫 **教師端管理**：流程設計器、學生管理、群組管理
- 👨‍🎓 **學生端介面**：互動式文獻回顧工具、證據收集、AI 輔助寫作
- 📄 **PDF 標註功能**：直接在 PDF 上標記和收集證據
- 🤖 **AI 輔助寫作**：整合 Azure OpenAI，協助學生完成各階段寫作任務
- 📊 **進度追蹤**：即時追蹤學生學習進度和使用情況

## 🏗️ 系統架構

```mermaid
graph TB
    subgraph "前端 Frontend"
        A[React + TypeScript + Vite]
        B[教師介面 Teacher Interface]
        C[學生介面 Student Interface]
    end
    
    subgraph "後端 Backend"
        D[FastAPI + Python]
        E[PostgreSQL 資料庫]
        F[認證服務 Auth Service]
    end
    
    subgraph "外部服務 External Services"
        G[Azure OpenAI]
        H[MinIO/S3 儲存]
    end
    
    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
```

## 🛠️ 技術棧

### 前端
- **React 18.3** - UI 框架
- **TypeScript** - 類型安全
- **Vite** - 建置工具
- **React Flow** - 流程圖視覺化
- **React PDF** - PDF 檢視與標註
- **Zustand** - 狀態管理
- **React Router** - 路由管理

### 後端
- **FastAPI** - Web 框架
- **Python 3.11** - 程式語言
- **PostgreSQL 16** - 關聯式資料庫
- **SQLAlchemy** - ORM
- **JWT** - 身份驗證
- **Boto3** - S3/MinIO 整合

### 部署與基礎設施
- **Docker** - 容器化
- **Docker Compose** - 多容器編排
- **Nginx** - 前端靜態檔案服務
- **PostgreSQL 16** - 關聯式資料庫
- **MinIO/S3** - 物件儲存服務

## 🚀 快速開始

### 前置需求

- **Docker 20.10+** 和 **Docker Compose 2.0+**（推薦方式）
- Node.js 18+（僅本地開發需要）
- Python 3.11+（僅本地開發需要）
- 至少 2GB 可用記憶體

### 使用 Docker Compose（推薦）

這是最簡單的部署方式，所有服務都會自動配置並啟動。

#### 1. 複製環境變數檔案

```bash
cp .env.example .env
```

#### 2. 配置環境變數

編輯 `.env` 檔案，填入必要的配置。**開發環境**可以只填寫基本配置：

```env
# 前端配置（開發環境可留空，使用預設值）
VITE_API_BASE=http://localhost:8000
FRONTEND_DOMAIN=
FRONTEND_PORT=3000

# 後端配置（開發環境可留空，使用預設值）
BACKEND_DOMAIN=
BACKEND_PORT=8000

# 必須配置的服務
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview

MINIO_ENDPOINT=your-minio-endpoint:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=your-bucket-name
MINIO_USE_SSL=false

JWT_SECRET=your-strong-secret-key-change-this
```

> 💡 **提示**：開發環境不需要填寫 `FRONTEND_DOMAIN` 和 `BACKEND_DOMAIN`，系統會自動使用 localhost。生產環境才需要填寫這些值。

#### 3. 啟動服務

```bash
# 建置並啟動所有服務（背景執行）
docker compose up -d

# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f
```

#### 4. 訪問應用

- **前端**：http://localhost:3000
- **後端 API**：http://localhost:8000
- **API 文檔**：http://localhost:8000/docs
- **健康檢查**：
  - 前端：http://localhost:3000/health
  - 後端：http://localhost:8000/health

#### 5. 停止服務

```bash
# 停止服務（保留資料）
docker compose down

# 停止服務並刪除所有資料（包括資料庫）
docker compose down -v
```

#### Docker 服務說明

系統包含三個 Docker 服務：

| 服務 | 端口 | 說明 |
|------|------|------|
| `frontend` | 3000 | React 前端應用（nginx 服務） |
| `backend` | 8000 | FastAPI 後端服務 |
| `postgres` | 5432 | PostgreSQL 16 資料庫 |

所有服務都在 `thesisflow-network` 網路中，可以透過服務名稱互相訪問。

### 本地開發

如果您想在本地進行開發（不使用 Docker），可以分別啟動前端和後端。

#### 前置準備

1. **啟動資料庫**（仍可使用 Docker）：

```bash
# 只啟動資料庫服務
docker compose up -d postgres
```

#### 前端開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（預設 port 3000）
npm run dev
```

前端會自動連接到後端 API（根據 `VITE_API_BASE` 環境變數）。

#### 後端開發

```bash
cd backend

# 安裝依賴（建議使用虛擬環境）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 配置環境變數
cp env.example env.local
# 編輯 env.local 填入實際值
# 注意：DATABASE_URL 應使用 localhost:5432 或 docker 服務名稱

# 啟動開發伺服器（支援熱重載）
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 混合模式開發

您也可以只使用 Docker 運行部分服務：

```bash
# 只啟動資料庫和後端（前端本地開發）
docker compose up -d postgres backend

# 只啟動資料庫（前後端都本地開發）
docker compose up -d postgres
```

> 📖 **詳細部署說明**：請參考 [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) 了解完整的部署配置、生產環境設定和故障排除指南。

## 📁 項目結構

```
thesisflow-ai-flow/
├── backend/                 # FastAPI 後端服務
│   ├── main.py             # 主應用入口
│   ├── models.py           # 資料庫模型
│   ├── schemas.py          # Pydantic 模式
│   ├── services.py         # 業務邏輯服務
│   ├── auth.py             # 認證相關
│   ├── db.py               # 資料庫配置
│   ├── requirements.txt    # Python 依賴
│   └── Dockerfile          # 後端 Docker 配置
├── components/             # React 組件
│   ├── TeacherInterface.tsx # 教師流程設計器
│   ├── StudentInterface.tsx # 學生學習介面
│   ├── ChatMainPanel.tsx   # 聊天主面板
│   └── widgets/            # 各種功能組件
├── pages/                  # 頁面組件
│   ├── LoginPage.tsx       # 登入頁面
│   ├── TeacherHome.tsx     # 教師首頁
│   └── StudentHome.tsx     # 學生首頁
├── docker-compose.yml      # Docker Compose 配置
├── Dockerfile              # 前端 Docker 配置
├── nginx.conf              # Nginx 配置檔案
├── .env.example            # 環境變數範例（Docker）
├── .dockerignore           # Docker 建置排除檔案
├── package.json            # Node.js 依賴
├── DOCKER_DEPLOYMENT.md    # Docker 部署詳細文檔
└── README.md               # 本文件
```

## ⚙️ 環境變數配置

### Docker 環境變數（`.env` 檔案）

使用 Docker Compose 時，在專案根目錄的 `.env` 檔案中配置所有環境變數。

#### 前端環境變數

| 變數名稱 | 說明 | 預設值 | 範例 |
|---------|------|--------|------|
| `VITE_API_BASE` | 後端 API 基礎 URL（建置時注入） | `http://localhost:8000` | `http://localhost:8000` 或 `https://api.yourdomain.com` |
| `FRONTEND_DOMAIN` | 前端域名（用於 CORS，生產環境必填） | - | `https://yourdomain.com` |
| `FRONTEND_PORT` | 前端服務端口 | `3000` | `3000` |

#### 後端環境變數

| 變數名稱 | 說明 | 預設值 | 範例 |
|---------|------|--------|------|
| `DATABASE_URL` | PostgreSQL 連接字串（Docker 自動設定） | `postgresql://postgres:postgres@postgres:5432/thesisflow` | - |
| `BACKEND_DOMAIN` | 後端域名（用於 CORS，生產環境可填） | - | `https://api.yourdomain.com` |
| `BACKEND_PORT` | 後端服務端口 | `8000` | `8000` |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI 端點 | - | `https://xxx.cognitiveservices.azure.com` |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API 金鑰 | - | `your_api_key` |
| `AZURE_OPENAI_DEPLOYMENT` | 部署名稱 | - | `gpt-4.1-mini` |
| `AZURE_OPENAI_API_VERSION` | API 版本 | - | `2025-01-01-preview` |
| `MINIO_ENDPOINT` | MinIO 服務端點 | - | `localhost:9000` |
| `MINIO_ACCESS_KEY` | MinIO Access Key | - | `your_access_key` |
| `MINIO_SECRET_KEY` | MinIO Secret Key | - | `your_secret_key` |
| `MINIO_BUCKET` | MinIO Bucket 名稱 | - | `your-bucket-name` |
| `MINIO_USE_SSL` | 是否使用 SSL | `false` | `true` 或 `false` |
| `JWT_SECRET` | JWT 簽名密鑰 | `change-me` | `your-strong-secret-key` |

### 本地開發環境變數

#### 前端（`.env.local` 或 `.env`）

```env
VITE_API_BASE=http://localhost:8000
```

#### 後端（`backend/env.local`）

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/thesisflow
# 其他變數與 Docker 環境相同
```

### 環境變數範例檔案

- **根目錄** `.env.example` - Docker Compose 環境變數範例
- **後端** `backend/env.example` - 本地開發環境變數範例

### 開發環境 vs 生產環境

**開發環境**：
- 不需要填寫 `FRONTEND_DOMAIN` 和 `BACKEND_DOMAIN`
- 系統自動使用 `localhost` 和預設端口
- CORS 自動允許 localhost 來源

**生產環境**：
- 必須填寫 `FRONTEND_DOMAIN` 和 `BACKEND_DOMAIN`（如果使用 Cloudflare Tunnel 等）
- 建議使用 HTTPS
- 使用強密碼的 `JWT_SECRET`

## 📚 API 文檔

啟動後端服務後，可訪問：

- **Swagger UI**：http://localhost:8000/docs
- **ReDoc**：http://localhost:8000/redoc

## 🔐 安全注意事項

### 環境變數安全

- ⚠️ **絕不要**將 `.env`、`.env.local` 或 `backend/env.local` 提交到版本控制
- ⚠️ 使用 `.gitignore` 確保敏感檔案不會被提交
- ⚠️ 生產環境請使用強密碼的 `JWT_SECRET`（至少 32 字元）

### 生產環境安全

- ⚠️ **必須使用 HTTPS** 部署生產環境
- ⚠️ 限制資料庫端口對外暴露（僅內部網路可訪問）
- ⚠️ 定期更新 Docker 映像和依賴套件以修補安全漏洞
- ⚠️ 使用強密碼和適當的資源限制
- ⚠️ 設定適當的備份策略

### Docker 安全

- 定期更新基礎映像（`python:3.11-slim`、`node:20-alpine`、`postgres:16`）
- 不要在容器中以 root 用戶運行應用（目前後端使用 root，可進一步優化）
- 使用 Docker secrets 管理敏感資訊（生產環境建議）

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 常見問題

### Docker 相關問題

#### Q: Docker 建置失敗，提示找不到 package-lock.json？

A: 這通常是因為 `.dockerignore` 排除了 `package-lock.json`。請確認 `.dockerignore` 中沒有排除此檔案，或執行：

```bash
docker compose build --no-cache frontend
```

#### Q: 啟動時提示 `.env` 檔案不存在？

A: `.env` 檔案是可選的。如果沒有 `.env` 檔案，Docker Compose 會使用環境變數的預設值。若要自訂配置：

```bash
cp .env.example .env
# 編輯 .env 填入實際值
```

#### Q: 端口已被占用？

A: 修改 `.env` 檔案中的端口配置：

```env
FRONTEND_PORT=3001  # 改用其他端口
BACKEND_PORT=8001   # 改用其他端口
```

然後重新啟動：

```bash
docker compose down
docker compose up -d
```

#### Q: 如何查看服務日誌？

A: 使用以下命令：

```bash
# 查看所有服務日誌
docker compose logs -f

# 查看特定服務日誌
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

#### Q: 如何重置資料庫？

A: 停止服務並刪除資料卷：

```bash
docker compose down -v
docker compose up -d
```

### 應用程式問題

#### Q: 前端無法連接到後端？

A: 檢查以下項目：
- 確認 `VITE_API_BASE` 環境變數正確設定（Docker 環境在 `.env` 中）
- 確認後端服務正在運行：`docker compose ps`
- 檢查瀏覽器控制台的錯誤訊息
- 確認 CORS 設定正確（開發環境自動允許 localhost）

#### Q: 資料庫連接失敗？

A: 確認：
- PostgreSQL 服務正在運行：`docker compose ps postgres`
- Docker 環境中 `DATABASE_URL` 應使用服務名稱 `postgres` 而非 `localhost`
- 檢查資料庫健康狀態：`docker compose logs postgres`

#### Q: CORS 錯誤？

A: 
- **開發環境**：不需要配置，系統自動允許 localhost
- **生產環境**：必須在 `.env` 中填寫 `FRONTEND_DOMAIN`，例如：`FRONTEND_DOMAIN=https://yourdomain.com`

### 更多問題

詳細的故障排除指南請參考 [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) 的「常見問題」章節。

## 📄 許可證

本專案採用 [MIT License](LICENSE) 許可證。

## 🙏 致謝

- [SALSA Framework](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1538584/) - 文獻回顧方法論
- [FastAPI](https://fastapi.tiangolo.com/) - 現代化的 Python Web 框架
- [React Flow](https://reactflow.dev/) - 流程圖視覺化庫

## 📧 聯絡方式

如有問題或建議，請開啟 [Issue](https://github.com/Bighsueh/thesisflow/issues)。

---

<div align="center">

Made with ❤️ for academic research

</div>
