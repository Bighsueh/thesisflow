#!/bin/bash

# 診斷腳本：檢查 Docker 容器中的 Azure OpenAI 環境變數

echo "=== 檢查 Docker 容器中的 Azure OpenAI 環境變數 ==="
echo ""

# 檢查後端容器是否存在
if ! docker compose ps backend | grep -q "Up"; then
    echo "❌ 錯誤：後端容器未運行"
    echo "請先執行：docker compose up -d"
    exit 1
fi

echo "1. 檢查容器中的環境變數："
echo "----------------------------------------"
docker compose exec backend env | grep AZURE_OPENAI || echo "⚠️  未找到 AZURE_OPENAI 相關環境變數"
echo ""

echo "2. 檢查主機上的 .env 文件（如果存在）："
echo "----------------------------------------"
if [ -f ".env" ]; then
    echo "找到 .env 文件："
    grep AZURE_OPENAI .env || echo "⚠️  .env 文件中未找到 AZURE_OPENAI 相關配置"
else
    echo "⚠️  未找到 .env 文件"
fi
echo ""

echo "3. 檢查 backend/env.local 文件（如果存在）："
echo "----------------------------------------"
if [ -f "backend/env.local" ]; then
    echo "找到 backend/env.local 文件："
    grep AZURE_OPENAI backend/env.local || echo "⚠️  backend/env.local 文件中未找到 AZURE_OPENAI 相關配置"
else
    echo "⚠️  未找到 backend/env.local 文件（這是正常的，如果使用 Docker 環境變數）"
fi
echo ""

echo "4. 測試 Python 環境變數讀取："
echo "----------------------------------------"
docker compose exec backend python -c "
import os
print('AZURE_OPENAI_ENDPOINT:', os.getenv('AZURE_OPENAI_ENDPOINT', '(未設置)'))
print('AZURE_OPENAI_DEPLOYMENT:', os.getenv('AZURE_OPENAI_DEPLOYMENT', '(未設置)'))
print('AZURE_OPENAI_API_KEY:', '已設置' if os.getenv('AZURE_OPENAI_API_KEY') else '(未設置)')
print('AZURE_OPENAI_API_VERSION:', os.getenv('AZURE_OPENAI_API_VERSION', '(未設置)'))
"
echo ""

echo "=== 診斷完成 ==="
echo ""
echo "如果環境變數顯示為 '(未設置)'，請檢查："
echo "1. 確保在專案根目錄有 .env 文件，或"
echo "2. 確保在遠端主機上設置了環境變數，或"
echo "3. 檢查 docker-compose.yml 中的環境變數配置"






