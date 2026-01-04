"""
RAG 處理服務

提供文檔 RAG 處理的業務邏輯
"""

import os
import tempfile
import logging
from typing import Optional, Tuple
from sqlalchemy.orm import Session

import models
from rag import (
    get_parser,
    chunk_text,
    ChunkingConfig,
    get_embedding_client,
    get_vector_store,
)

logger = logging.getLogger(__name__)


def process_document_rag(
    document_id: str,
    file_content: bytes,
    db: Session
) -> Tuple[bool, Optional[str]]:
    """
    處理文檔的 RAG 流程（Parse → Chunk → Embed → Store）

    Args:
        document_id: 文檔 ID
        file_content: PDF 檔案內容
        db: 資料庫 session

    Returns:
        Tuple[bool, Optional[str]]: (是否成功, 錯誤訊息)
    """
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        return False, "文檔不存在"

    # 更新狀態為處理中
    doc.rag_status = "processing"
    db.commit()

    try:
        # Step 1: 將檔案內容寫入臨時檔案
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name

        try:
            # Step 2: 解析 PDF
            parser = get_parser("pymupdf")
            parse_result = parser(tmp_path)

            if not parse_result["success"]:
                raise Exception(f"PDF 解析失敗: {parse_result.get('error', '未知錯誤')}")

            content = parse_result["content"]
            pages = parse_result["pages"]

            if not content or not content.strip():
                raise Exception("PDF 內容為空")

            # Step 3: 切分文本
            config = ChunkingConfig(
                chunk_size=500,
                chunk_overlap=50,
                min_chunk_size=100
            )
            chunks = chunk_text(content, pages, config)

            if not chunks:
                raise Exception("切分結果為空")

            # Step 4: 生成 Embeddings
            embedding_client = get_embedding_client()
            chunk_contents = [c.content for c in chunks]
            embeddings = embedding_client.embed_texts(chunk_contents)

            if len(embeddings) != len(chunks):
                raise Exception("Embedding 數量與 chunk 數量不匹配")

            # Step 5: 儲存到 ChromaDB
            vector_store = get_vector_store()

            # 先刪除舊的向量（如果有）
            vector_store.delete_document(document_id)

            # 準備 chunk 資料
            chunk_data = [
                {
                    "index": c.index,
                    "content": c.content,
                    "page_numbers": c.page_numbers
                }
                for c in chunks
            ]

            # 新增到向量庫
            added_count = vector_store.add_chunks(document_id, chunk_data, embeddings)

            # Step 6: 在資料庫中記錄 chunk 資訊
            # 先刪除舊的 chunk 記錄
            db.query(models.DocumentChunk).filter(
                models.DocumentChunk.document_id == document_id
            ).delete()

            # 建立新的 chunk 記錄
            for c in chunks:
                chunk_record = models.DocumentChunk(
                    id=f"{document_id}_{c.index}",
                    document_id=document_id,
                    chunk_index=c.index,
                    content_preview=c.content[:200] if c.content else None,
                    page_numbers=c.page_numbers,
                    char_count=len(c.content)
                )
                db.add(chunk_record)

            # 更新文檔狀態
            doc.rag_status = "completed"
            doc.rag_error = None
            doc.chunk_count = added_count
            db.commit()

            logger.info(f"RAG 處理完成: document_id={document_id}, chunks={added_count}")
            return True, None

        finally:
            # 清理臨時檔案
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    except Exception as e:
        error_msg = str(e)
        logger.error(f"RAG 處理失敗: document_id={document_id}, error={error_msg}")

        # 更新文檔狀態為失敗
        doc.rag_status = "failed"
        doc.rag_error = error_msg[:500]  # 限制錯誤訊息長度
        db.commit()

        return False, error_msg


def delete_document_vectors(document_id: str) -> int:
    """
    刪除文檔的向量資料

    Args:
        document_id: 文檔 ID

    Returns:
        int: 刪除的向量數量
    """
    try:
        vector_store = get_vector_store()
        return vector_store.delete_document(document_id)
    except Exception as e:
        logger.error(f"刪除向量失敗: document_id={document_id}, error={e}")
        return 0


def get_document_rag_status(document_id: str, db: Session) -> dict:
    """
    取得文檔的 RAG 處理狀態

    Args:
        document_id: 文檔 ID
        db: 資料庫 session

    Returns:
        dict: {status, error, chunk_count}
    """
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        return {"status": "not_found", "error": "文檔不存在", "chunk_count": 0}

    return {
        "status": doc.rag_status,
        "error": doc.rag_error,
        "chunk_count": doc.chunk_count
    }
