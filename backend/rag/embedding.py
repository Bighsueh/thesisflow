"""
Azure OpenAI Embedding 模組

使用 Azure OpenAI 的 text-embedding-3-large 模型生成向量
"""

import os
from typing import List, Optional

from openai import AzureOpenAI


class AzureEmbeddingClient:
    """
    Azure OpenAI Embedding 客戶端

    使用獨立的 Azure 端點（與 Chat 分離）
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        deployment: Optional[str] = None,
        api_version: Optional[str] = None
    ):
        """
        初始化 Embedding 客戶端

        Args:
            endpoint: Azure OpenAI 端點（預設從環境變數讀取）
            api_key: API 金鑰（預設從環境變數讀取）
            deployment: 部署名稱（預設從環境變數讀取）
            api_version: API 版本（預設從環境變數讀取）
        """
        self.endpoint = endpoint or os.getenv("AZURE_EMBEDDING_ENDPOINT")
        self.api_key = api_key or os.getenv("AZURE_EMBEDDING_API_KEY")
        self.deployment = deployment or os.getenv(
            "AZURE_EMBEDDING_DEPLOYMENT",
            "text-embedding-3-large"
        )
        self.api_version = api_version or os.getenv(
            "AZURE_EMBEDDING_API_VERSION",
            "2024-12-01-preview"
        )

        if not self.endpoint:
            raise ValueError("AZURE_EMBEDDING_ENDPOINT 未設定")
        if not self.api_key:
            raise ValueError("AZURE_EMBEDDING_API_KEY 未設定")

        # 初始化 Azure OpenAI 客戶端
        self.client = AzureOpenAI(
            azure_endpoint=self.endpoint,
            api_key=self.api_key,
            api_version=self.api_version
        )

        # 批次處理設定
        self.batch_size = 16  # Azure OpenAI 建議的批次大小

    def embed_text(self, text: str) -> List[float]:
        """
        生成單一文本的向量

        Args:
            text: 要向量化的文本

        Returns:
            List[float]: 向量（維度取決於模型，text-embedding-3-large 為 3072）
        """
        if not text or not text.strip():
            raise ValueError("文本不能為空")

        response = self.client.embeddings.create(
            input=text,
            model=self.deployment
        )

        return response.data[0].embedding

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        批次生成多個文本的向量

        Args:
            texts: 要向量化的文本列表

        Returns:
            List[List[float]]: 向量列表
        """
        if not texts:
            return []

        # 過濾空文本
        valid_texts = [t for t in texts if t and t.strip()]
        if not valid_texts:
            return []

        embeddings: List[List[float]] = []

        # 批次處理
        for i in range(0, len(valid_texts), self.batch_size):
            batch = valid_texts[i:i + self.batch_size]

            response = self.client.embeddings.create(
                input=batch,
                model=self.deployment
            )

            # 按順序收集結果
            batch_embeddings = [item.embedding for item in response.data]
            embeddings.extend(batch_embeddings)

        return embeddings

    def get_embedding_dimension(self) -> int:
        """
        取得向量維度

        Returns:
            int: 向量維度（text-embedding-3-large 為 3072）
        """
        # text-embedding-3-large 的維度
        return 3072


# 模組級別的客戶端實例（延遲初始化）
_embedding_client: Optional[AzureEmbeddingClient] = None


def get_embedding_client() -> AzureEmbeddingClient:
    """
    取得 Embedding 客戶端單例

    Returns:
        AzureEmbeddingClient: 客戶端實例
    """
    global _embedding_client

    if _embedding_client is None:
        _embedding_client = AzureEmbeddingClient()

    return _embedding_client


def reset_embedding_client() -> None:
    """
    重置 Embedding 客戶端（主要用於測試）
    """
    global _embedding_client
    _embedding_client = None
