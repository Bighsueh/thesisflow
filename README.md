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

### 部署
- **Docker** - 容器化
- **Docker Compose** - 多容器編排
- **Nginx** - 前端靜態檔案服務

## 🚀 快速開始

### 前置需求

- Docker 20.10+ 和 Docker Compose 2.0+
- Node.js 18+（僅本地開發需要）
- Python 3.11+（僅本地開發需要）

### 使用 Docker Compose（推薦）

1. **複製環境變數檔案**

```bash
cp .env.example .env
```

2. **配置環境變數**

編輯 `.env` 檔案，填入必要的配置：

```env
# 必須配置
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your_api_key
MINIO_ENDPOINT=your-minio-endpoint:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=your-bucket-name
JWT_SECRET=your-strong-secret-key
```

3. **啟動服務**

```bash
docker compose up -d
```

4. **訪問應用**

- 前端：http://localhost:3000
- 後端 API：http://localhost:8000
- API 文檔：http://localhost:8000/docs

### 本地開發

#### 前端開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

#### 後端開發

```bash
cd backend

# 安裝依賴（建議使用虛擬環境）
pip install -r requirements.txt

# 配置環境變數
cp env.example env.local
# 編輯 env.local 填入實際值

# 啟動開發伺服器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

詳細的部署說明請參考 [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

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
├── package.json            # Node.js 依賴
└── README.md               # 本文件
```

## ⚙️ 環境變數配置

### 前端環境變數

在 `.env` 或 `.env.local` 中配置：

```env
VITE_API_BASE=http://localhost:8000
```

### 後端環境變數

在 `backend/env.local` 或 `.env` 中配置：

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `DATABASE_URL` | PostgreSQL 連接字串 | `postgresql://user:pass@host:5432/dbname` |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI 端點 | `https://xxx.cognitiveservices.azure.com` |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API 金鑰 | `your_api_key` |
| `AZURE_OPENAI_DEPLOYMENT` | 部署名稱 | `gpt-4.1-mini` |
| `MINIO_ENDPOINT` | MinIO 服務端點 | `localhost:9000` |
| `MINIO_ACCESS_KEY` | MinIO Access Key | `your_access_key` |
| `MINIO_SECRET_KEY` | MinIO Secret Key | `your_secret_key` |
| `MINIO_BUCKET` | MinIO Bucket 名稱 | `your-bucket-name` |
| `JWT_SECRET` | JWT 簽名密鑰 | `your-secret-key` |
| `FRONTEND_DOMAIN` | 前端域名（CORS） | `https://yourdomain.com` |

詳細說明請參考：
- 根目錄 `.env.example`
- `backend/env.example`

## 📚 API 文檔

啟動後端服務後，可訪問：

- **Swagger UI**：http://localhost:8000/docs
- **ReDoc**：http://localhost:8000/redoc

## 🔐 安全注意事項

- ⚠️ **絕不要**將 `.env`、`.env.local` 或 `backend/env.local` 提交到版本控制
- ⚠️ 生產環境請使用強密碼的 `JWT_SECRET`
- ⚠️ 建議使用 HTTPS 部署生產環境
- ⚠️ 定期更新依賴套件以修補安全漏洞

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 常見問題

### Q: 前端無法連接到後端？

A: 檢查以下項目：
- 確認 `VITE_API_BASE` 環境變數正確設定
- 確認後端服務正在運行
- 檢查瀏覽器控制台的錯誤訊息

### Q: 資料庫連接失敗？

A: 確認：
- PostgreSQL 服務正在運行
- `DATABASE_URL` 環境變數正確
- 資料庫用戶權限設定正確

### Q: Docker 建置失敗？

A: 嘗試：
```bash
docker compose build --no-cache
```

更多問題請參考 [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) 的常見問題章節。

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
