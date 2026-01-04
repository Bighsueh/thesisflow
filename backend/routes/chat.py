from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
from services import AzureOpenAIClient, presign_get
import json
import logging
from typing import Optional, List

# RAG 相關導入
try:
    from rag import get_embedding_client, get_vector_store
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/projects", tags=["chat"])


async def retrieve_rag_context(
    query: str,
    document_id: str,
    db: Session,
    n_results: int = 3
) -> Optional[str]:
    """
    從指定文檔檢索相關內容

    Args:
        query: 查詢文本
        document_id: 文檔 ID
        db: 資料庫 session
        n_results: 返回結果數量

    Returns:
        str: 格式化的相關內容，若失敗則返回 None
    """
    if not RAG_AVAILABLE:
        logger.warning("RAG module not available")
        return None

    try:
        # 驗證文檔存在且 RAG 處理已完成
        doc = db.query(models.Document).filter(models.Document.id == document_id).first()
        if not doc:
            logger.warning(f"Document not found: {document_id}")
            return None

        if doc.rag_status != "completed":
            logger.info(f"Document RAG not ready: {document_id}, status={doc.rag_status}")
            return None

        # 生成查詢向量
        embedding_client = get_embedding_client()
        query_embedding = embedding_client.embed_text(query)

        # 搜尋相關 chunks（只搜尋當前文檔）
        vector_store = get_vector_store()
        results = vector_store.search(
            query_embedding=query_embedding,
            document_ids=[document_id],
            n_results=n_results
        )

        if not results:
            logger.info(f"No relevant chunks found for document: {document_id}")
            return None

        # 格式化結果
        context_parts = []
        for i, result in enumerate(results):
            page_info = f"第 {', '.join(map(str, result.page_numbers))} 頁" if result.page_numbers else ""
            context_parts.append(f"""
[相關段落 {i + 1}] {page_info}
{result.content}
""")

        return "\n".join(context_parts)

    except Exception as e:
        logger.error(f"RAG retrieval failed: {e}")
        return None


@router.post("/{project_id}/chat", response_model=schemas.ChatResponse)
async def chat(
    project_id: str,
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 驗證 payload 中的 project_id 與路徑參數一致
    if payload.project_id != project_id:
        raise HTTPException(status_code=400, detail="project_id in payload must match path parameter")
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    node = db.query(models.FlowNode).filter(
        models.FlowNode.id == payload.node_id,
        models.FlowNode.project_id == project_id
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # 構建上下文提示
    context = payload.context
    current_document_id = context.get("current_document_id")
    evidence_ids = context.get("evidence_ids", [])
    evidence_info = context.get("evidence_info", {})
    widget_states = context.get("widget_states", {})
    chat_history = context.get("chat_history", [])

    # RAG 檢索：從當前文檔取得相關內容
    rag_context = None
    current_doc_title = None
    if current_document_id:
        # 取得文檔標題
        current_doc = db.query(models.Document).filter(
            models.Document.id == current_document_id
        ).first()
        if current_doc:
            current_doc_title = current_doc.title
            # 執行 RAG 檢索
            rag_context = await retrieve_rag_context(
                query=payload.message,
                document_id=current_document_id,
                db=db,
                n_results=3
            )

    # 構建系統提示
    system_prompt_parts = [f"""你是論文寫作教練，正在指導學生完成「{node.label}」任務。

當前任務說明：{node.config.get('guidance', '請按照指示完成任務')}"""]

    # 加入當前文檔資訊
    if current_doc_title:
        system_prompt_parts.append(f"\n當前討論文檔：《{current_doc_title}》")

    # 加入 RAG 檢索到的相關內容
    if rag_context:
        system_prompt_parts.append(f"""

以下是從當前文檔中檢索到的相關段落，請參考這些內容回答學生的問題：
{rag_context}""")

    system_prompt_parts.append("""

你的角色：
1. 提供引導性問題，幫助學生思考
2. 檢核學生的填寫是否符合要求（如是否有證據支持）
3. 指出需要改進的地方，但不要直接代寫
4. 根據學生的進度給予適當的鼓勵或提醒
5. 如果有相關段落資訊，請引用具體的頁碼和內容來支持你的回答

請用中文回覆，語氣友善且專業。""")

    system_prompt = "".join(system_prompt_parts)
    
    # 構建用戶提示
    user_parts = [f"學生訊息：{payload.message}"]
    
    # 處理標記片段信息
    if evidence_info:
        evidence_details = []
        for evidence_id, info in evidence_info.items():
            document_url = None
            if info.get("object_key"):
                try:
                    document_url = presign_get(info["object_key"])
                except Exception as e:
                    print(f"Warning: Failed to generate presigned URL for {info.get('object_key')}: {e}")
            
            evidence_detail = f"""
標記片段 #{len(evidence_details) + 1}:
- 便條名稱: {info.get('name') or '（未命名）'}
- 證據內容: {info.get('snippet', '')}
- 頁碼: {info.get('page') or '（未指定）'}
- 文檔名稱: {info.get('document_title', '未知文檔')}
- 文檔URL: {document_url or '（無法獲取）'}"""
            evidence_details.append(evidence_detail)
        
        if evidence_details:
            user_parts.append(f"\n\n學生在訊息中引用了 {len(evidence_details)} 則標記片段，詳細資訊如下：")
            user_parts.extend(evidence_details)
    
    if evidence_ids and not evidence_info:
        user_parts.append(f"\n學生已選擇 {len(evidence_ids)} 則證據。")
    
    if widget_states:
        user_parts.append(f"\n當前任務進度：{json.dumps(widget_states, ensure_ascii=False, indent=2)}")
    
    if chat_history:
        recent_history = chat_history[-5:]
        history_text = "\n".join([f"{'學生' if m.get('role') == 'user' else '教練'}: {m.get('content', '')}" for m in recent_history])
        user_parts.append(f"\n最近的對話歷史：\n{history_text}")
    
    user_prompt = "\n".join(user_parts)
    
    # 調用 Azure OpenAI
    azure = AzureOpenAIClient()
    response = await azure.chat(system_prompt, user_prompt)
    
    return schemas.ChatResponse(message=response, role="ai")

@router.get("/{project_id}/chat", response_model=list[schemas.ChatResponse])
def get_chat_history(
    project_id: str,
    step_id: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # TODO: 實現聊天歷史記錄功能
    # 目前返回空列表，可以後續實現持久化存儲
    return []
