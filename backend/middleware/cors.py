import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app: FastAPI):
    """
    設定 CORS 中間件
    根據環境變數自動配置允許的來源
    """
    frontend_domain = os.getenv("FRONTEND_DOMAIN", "").strip()
    frontend_port = os.getenv("FRONTEND_PORT", "3000").strip()
    backend_domain = os.getenv("BACKEND_DOMAIN", "").strip()
    
    # 允許的來源列表
    allowed_origins = []
    
    # 開發環境：自動允許 localhost
    if not frontend_domain:
        allowed_origins.extend([
            f"http://localhost:{frontend_port}",
            "http://localhost:3000",
            "http://localhost:5173",  # Vite default port
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",  # Vite default port
            "http://Localhost:3000",  # Case variation
            "http://Localhost:5173",  # Case variation
        ])
    else:
        # 生產環境：使用設定的域名
        allowed_origins.append(frontend_domain)
        # 也允許 http 版本（如果設定了 https）
        if frontend_domain.startswith("https://"):
            allowed_origins.append(frontend_domain.replace("https://", "http://"))
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
