import os
import uuid
import logging
import base64
import httpx
import boto3
from botocore.client import Config
from dotenv import load_dotenv
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

logger = logging.getLogger(__name__)

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
    client = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=os.getenv("MINIO_ACCESS_KEY"),
        aws_secret_access_key=os.getenv("MINIO_SECRET_KEY"),
        config=config,
        region_name="us-east-1",  # MinIO 需要一個區域，即使不使用 AWS
    )
    return client


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
    
    # 驗證文件是否存在
    try:
        client.head_object(Bucket=bucket, Key=object_key)
    except Exception as e:
        # 如果文件不存在，記錄錯誤但不阻止 URL 生成（讓前端處理 404）
        print(f"Warning: File not found in MinIO: {object_key}, error: {e}")
    
    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": object_key},
        ExpiresIn=3600,
    )
    return url


def download_file_from_minio(object_key: str) -> bytes:
    """
    從 MinIO 下載檔案並返回 bytes
    
    Args:
        object_key: 檔案的 object key
        
    Returns:
        bytes: 檔案內容
        
    Raises:
        Exception: 如果檔案不存在或下載失敗
    """
    bucket = os.getenv("MINIO_BUCKET")
    client = get_s3_client()
    
    try:
        response = client.get_object(Bucket=bucket, Key=object_key)
        return response['Body'].read()
    except Exception as e:
        logger.error(f"Failed to download file from MinIO: {object_key}, error: {e}")
        raise


# --- Azure OpenAI ---
class AzureOpenAIClient:
    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY", "")

    def is_ready(self) -> bool:
        return all([self.endpoint, self.deployment, self.api_version, self.api_key])

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.ConnectError) | retry_if_exception_type(httpx.ConnectTimeout) | retry_if_exception_type(httpx.ReadTimeout),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _make_request(url: str, headers: dict, payload: dict) -> dict:
        """內部方法：執行 HTTP 請求（帶重試機制）"""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()

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
            "max_completion_tokens": 2048,
        }
        try:
            data = await self._make_request(url, headers, payload)
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

    async def chat_with_history(
        self, 
        system_prompt: str, 
        messages: list[dict],
        max_tokens: int = 2048
    ) -> str:
        """
        使用對話歷史進行聊天
        
        Args:
            system_prompt: 系統提示
            messages: 對話歷史陣列 [{"role": "user/assistant", "content": "..."}]
            max_tokens: 最大輸出 token 數
            
        Returns:
            str: AI 的回應內容
        """
        if not self.is_ready():
            return "Azure OpenAI 尚未設定 API KEY/ENDPOINT。"

        url = f"{self.endpoint}/openai/deployments/{self.deployment}/chat/completions?api-version={self.api_version}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        
        # 構建 messages 陣列：system prompt + 歷史訊息
        full_messages = [{"role": "system", "content": system_prompt}]
        full_messages.extend(messages)
        
        payload = {
            "messages": full_messages,
            "model": self.deployment,
            "temperature": 0.2,
            "max_completion_tokens": max_tokens,
        }
        try:
            data = await self._make_request(url, headers, payload)
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


# --- Azure OpenAI Responses API (PDF Analysis) ---
class AzureResponsesAPIClient:
    """Azure OpenAI Responses API 客戶端，用於直接分析 PDF"""
    
    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY", "")

    def is_ready(self) -> bool:
        return all([self.endpoint, self.deployment, self.api_version, self.api_key])

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.ConnectError) | retry_if_exception_type(httpx.ConnectTimeout) | retry_if_exception_type(httpx.ReadTimeout),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _make_request(url: str, headers: dict, payload: dict) -> dict:
        """內部方法：執行 HTTP 請求（帶重試機制），timeout 設為 120 秒以應對 PDF 處理"""
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def chat_with_pdf(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        pdf_base64: str,
        filename: str
    ) -> str:
        """
        使用 Responses API 發送包含 PDF 的聊天請求
        
        Args:
            system_prompt: 系統提示
            user_prompt: 用戶提示
            pdf_base64: PDF 檔案的 Base64 編碼字串（不含 data URI 前綴）
            filename: PDF 檔案名稱
            
        Returns:
            str: AI 的回應內容
        """
        if not self.is_ready():
            return "Azure OpenAI 尚未設定 API KEY/ENDPOINT。"

        # 使用 Responses API endpoint
        url = f"{self.endpoint}/openai/v1/responses"
        headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key,
        }
        
        # 構建符合 Responses API 格式的請求
        # 參考: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/responses
        payload = {
            "model": self.deployment,
            "input": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_file",
                            "filename": filename,
                            "file_data": f"data:application/pdf;base64,{pdf_base64}",
                        },
                        {
                            "type": "input_text",
                            "text": f"{system_prompt}\n\n{user_prompt}",
                        }
                    ]
                }
            ],
            "temperature": 0.2,
            "max_output_tokens": 4096,
        }
        
        try:
            data = await self._make_request(url, headers, payload)
            # Responses API 回應格式：使用 output_text 欄位
            if "output_text" in data:
                return data["output_text"]
            elif "output" in data and isinstance(data["output"], list) and len(data["output"]) > 0:
                # 備用：從 output 陣列中提取文字
                for item in data["output"]:
                    if item.get("type") == "message" and "content" in item:
                        for content in item["content"]:
                            if content.get("type") == "output_text":
                                return content.get("text", "")
            return "無法從回應中提取內容"
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return f"Azure OpenAI 部署 '{self.deployment}' 不存在或無法訪問。請檢查部署名稱是否正確。"
            elif e.response.status_code == 401:
                return "Azure OpenAI API 金鑰無效或已過期。"
            elif e.response.status_code == 403:
                return "Azure OpenAI 權限不足，無法訪問該部署。"
            elif e.response.status_code == 400:
                # 400 錯誤通常包含詳細的錯誤訊息
                error_detail = e.response.text[:500] if e.response.text else '未知錯誤'
                return f"請求格式錯誤: {error_detail}"
            elif e.response.status_code == 413:
                return "PDF 檔案過大，無法進行 AI 分析（限制 50MB）。"
            else:
                return f"Azure OpenAI 錯誤 ({e.response.status_code}): {e.response.text[:200] if e.response.text else '未知錯誤'}"
        except Exception as e:
            return f"Azure OpenAI 連線錯誤: {str(e)}"

