FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 複製 requirements 檔案
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製後端程式碼
COPY . .

# 設定 entrypoint 腳本權限
RUN chmod +x /app/entrypoint.sh

# 暴露 port 8000
EXPOSE 8000

# 使用 entrypoint 腳本啟動（會自動執行資料庫遷移）
ENTRYPOINT ["/app/entrypoint.sh"]

