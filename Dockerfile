# 第一階段：建置 React 應用
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製所有檔案
COPY . .

# 建置應用（環境變數會在 docker-compose 中傳入）
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

# 第二階段：使用 nginx 服務靜態檔案
FROM nginx:alpine

# 複製 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 複製建置後的靜態檔案
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露 port 3000
EXPOSE 3000

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]






