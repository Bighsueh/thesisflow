"""
ChromaDB Vector Store 模組

使用 ChromaDB 儲存和檢索文檔向量
"""

import os
from dataclasses import dataclass
from typing import List, Optional

import chromadb
from chromadb.config import Settings


@dataclass
class SearchResult:
    """搜尋結果"""
    chunk_id: str           # chunk 的唯一識別碼
    document_id: str        # 所屬文檔 ID
    content: str            # chunk 內容
    score: float            # 相似度分數（距離越小越相似）
    page_numbers: List[int] # 涵蓋的頁碼
    chunk_index: int        # chunk 在文檔中的索引


class VectorStore:
    """
    ChromaDB Vector Store 封裝

    提供文檔向量的 CRUD 操作
    """

    COLLECTION_NAME = "document_chunks"

    def __init__(self, persist_directory: Optional[str] = None):
        """
        初始化 Vector Store

        Args:
            persist_directory: 持久化目錄（預設從環境變數讀取）
        """
        self.persist_directory = persist_directory or os.getenv(
            "CHROMA_PERSIST_DIRECTORY",
            "./chroma_data"
        )

        # 確保目錄存在
        os.makedirs(self.persist_directory, exist_ok=True)

        # 從環境變數讀取是否允許重置資料庫
        # 注意：生產環境應設為 false 以避免意外資料遺失
        allow_reset = os.getenv("CHROMA_ALLOW_RESET", "false").lower() == "true"

        # 初始化 ChromaDB 客戶端（持久化模式）
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=allow_reset
            )
        )

        # 取得或建立 collection
        self.collection = self.client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}  # 使用餘弦相似度
        )

    def add_chunks(
        self,
        document_id: str,
        chunks: List[dict],
        embeddings: List[List[float]]
    ) -> int:
        """
        新增文檔的 chunks 到向量庫

        Args:
            document_id: 文檔 ID
            chunks: chunk 列表，每個 chunk 包含:
                - index: int
                - content: str
                - page_numbers: List[int]
            embeddings: 對應的向量列表

        Returns:
            int: 新增的 chunk 數量
        """
        if not chunks or not embeddings:
            return 0

        if len(chunks) != len(embeddings):
            raise ValueError("chunks 和 embeddings 數量不匹配")

        ids = []
        documents = []
        metadatas = []

        for chunk in chunks:
            chunk_id = f"{document_id}_{chunk['index']}"
            ids.append(chunk_id)
            documents.append(chunk['content'])
            metadatas.append({
                "document_id": document_id,
                "chunk_index": chunk['index'],
                "page_numbers": ",".join(map(str, chunk['page_numbers']))
            })

        # 批次新增到 ChromaDB
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        return len(ids)

    def search(
        self,
        query_embedding: List[float],
        document_ids: Optional[List[str]] = None,
        n_results: int = 5
    ) -> List[SearchResult]:
        """
        搜尋最相關的 chunks

        Args:
            query_embedding: 查詢向量
            document_ids: 限定搜尋的文檔 ID 列表（None 表示搜尋全部）
            n_results: 返回結果數量

        Returns:
            List[SearchResult]: 搜尋結果列表
        """
        # 建立過濾條件
        where_filter = None
        if document_ids:
            if len(document_ids) == 1:
                where_filter = {"document_id": document_ids[0]}
            else:
                where_filter = {"document_id": {"$in": document_ids}}

        # 執行搜尋
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        # 轉換結果格式
        search_results = []

        if results and results['ids'] and results['ids'][0]:
            for i, chunk_id in enumerate(results['ids'][0]):
                metadata = results['metadatas'][0][i]
                page_numbers = [
                    int(p) for p in metadata.get('page_numbers', '1').split(',')
                    if p
                ]

                search_results.append(SearchResult(
                    chunk_id=chunk_id,
                    document_id=metadata['document_id'],
                    content=results['documents'][0][i],
                    score=results['distances'][0][i],
                    page_numbers=page_numbers,
                    chunk_index=metadata['chunk_index']
                ))

        return search_results

    def delete_document(self, document_id: str) -> int:
        """
        刪除指定文檔的所有 chunks

        Args:
            document_id: 文檔 ID

        Returns:
            int: 刪除的 chunk 數量
        """
        # 先查詢該文檔的所有 chunks
        results = self.collection.get(
            where={"document_id": document_id},
            include=[]
        )

        if not results or not results['ids']:
            return 0

        count = len(results['ids'])

        # 刪除
        self.collection.delete(
            where={"document_id": document_id}
        )

        return count

    def get_document_chunks(self, document_id: str) -> List[dict]:
        """
        取得指定文檔的所有 chunks

        Args:
            document_id: 文檔 ID

        Returns:
            List[dict]: chunk 資訊列表
        """
        results = self.collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"]
        )

        if not results or not results['ids']:
            return []

        chunks = []
        for i, chunk_id in enumerate(results['ids']):
            metadata = results['metadatas'][i]
            chunks.append({
                "chunk_id": chunk_id,
                "content": results['documents'][i],
                "chunk_index": metadata['chunk_index'],
                "page_numbers": metadata.get('page_numbers', '1')
            })

        # 按 chunk_index 排序
        chunks.sort(key=lambda x: x['chunk_index'])

        return chunks

    def count_chunks(self, document_id: Optional[str] = None) -> int:
        """
        計算 chunk 數量

        Args:
            document_id: 文檔 ID（None 表示計算全部）

        Returns:
            int: chunk 數量
        """
        if document_id:
            results = self.collection.get(
                where={"document_id": document_id},
                include=[]
            )
            return len(results['ids']) if results and results['ids'] else 0
        else:
            return self.collection.count()


# 模組級別的 Vector Store 實例（延遲初始化）
_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """
    取得 Vector Store 單例

    Returns:
        VectorStore: Vector Store 實例
    """
    global _vector_store

    if _vector_store is None:
        _vector_store = VectorStore()

    return _vector_store


def init_vector_store(persist_directory: Optional[str] = None) -> VectorStore:
    """
    初始化 Vector Store（可指定持久化目錄）

    Args:
        persist_directory: 持久化目錄

    Returns:
        VectorStore: Vector Store 實例
    """
    global _vector_store
    _vector_store = VectorStore(persist_directory)
    return _vector_store


def reset_vector_store() -> None:
    """
    重置 Vector Store（主要用於測試）
    """
    global _vector_store
    _vector_store = None
