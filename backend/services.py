import os
import uuid
import httpx
import boto3
from botocore.client import Config
from dotenv import load_dotenv

# 嘗試多個可能的路徑來載入環境變數
# 從 backend 目錄運行時使用 env.local
# 從項目根目錄運行時使用 backend/env.local
# Docker 容器中環境變數應通過 docker-compose.yml 傳遞，此處僅作為備用
_env_paths = [
    "env.local",
    "backend/env.local",
    os.path.join(os.path.dirname(__file__), "env.local"),
]
for _env_path in _env_paths:
    if os.path.exists(_env_path):
        load_dotenv(_env_path)
        break


# --- MinIO presign ---
def get_s3_client():
    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    use_ssl = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
    # MinIO 需要明確的端口號，即使對於 HTTPS
    # 如果 endpoint 不包含端口，根據 SSL 設置添加默認端口
    if ":" not in endpoint:
        endpoint = f"{endpoint}:{443 if use_ssl else 9000}"
    endpoint_url = f"http{'s' if use_ssl else ''}://{endpoint}"
    config = Config(
        signature_version="s3v4",
        s3={
            "addressing_style": "path"  # MinIO 通常使用 path-style
        }
    )
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=os.getenv("MINIO_ACCESS_KEY"),
        aws_secret_access_key=os.getenv("MINIO_SECRET_KEY"),
        config=config,
        region_name="us-east-1",  # MinIO 需要一個區域，即使不使用 AWS
    )


def presign_upload(filename: str, content_type: str):
    bucket = os.getenv("MINIO_BUCKET")
    object_key = f"uploads/{uuid.uuid4()}_{filename}"
    client = get_s3_client()
    url = client.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": object_key, "ContentType": content_type},
        ExpiresIn=3600,
    )
    return url, object_key


def presign_get(object_key: str):
    bucket = os.getenv("MINIO_BUCKET")
    client = get_s3_client()
    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": object_key},
        ExpiresIn=3600,
    )
    return url


# --- Azure OpenAI ---
class AzureOpenAIClient:
    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY", "")

    def is_ready(self) -> bool:
        return all([self.endpoint, self.deployment, self.api_version, self.api_key])

    async def chat(self, system_prompt: str, user_prompt: str) -> str:
        if not self.is_ready():
            return "Azure OpenAI 尚未設定 API KEY/ENDPOINT。"

        url = f"{self.endpoint}/openai/deployments/{self.deployment}/chat/completions?api-version={self.api_version}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "model": self.deployment,
            "temperature": 0.2,
            "max_completion_tokens": 800,
        }
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return f"Azure OpenAI 部署 '{self.deployment}' 不存在或無法訪問。請檢查部署名稱是否正確。"
            elif e.response.status_code == 401:
                return "Azure OpenAI API 金鑰無效或已過期。"
            elif e.response.status_code == 403:
                return "Azure OpenAI 權限不足，無法訪問該部署。"
            else:
                return f"Azure OpenAI 錯誤 ({e.response.status_code}): {e.response.text[:200] if e.response.text else '未知錯誤'}"
        except Exception as e:
            return f"Azure OpenAI 連線錯誤: {str(e)}"

