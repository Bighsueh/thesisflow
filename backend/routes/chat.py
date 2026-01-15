from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
from services import AzureResponsesAPIClient, presign_get, download_file_from_minio
import json
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/projects", tags=["chat"])

# PDF 大小限制：50MB
MAX_PDF_SIZE = 50 * 1024 * 1024


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
    
    # 新架構：支援 "general" 作為通用節點 ID（不需要查找實際的 FlowNode）
    node = None
    node_label = "學習任務"
    node_guidance = "請按照指示完成任務"
    
    if payload.node_id != "general":
        node = db.query(models.FlowNode).filter(
            models.FlowNode.id == payload.node_id,
            models.FlowNode.project_id == project_id
        ).first()
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        node_label = node.label
        node_guidance = node.config.get('guidance', '請按照指示完成任務') if node.config else '請按照指示完成任務'
    
    # 構建上下文提示
    context = payload.context
    current_document_id = context.get("current_document_id")
    evidence_ids = context.get("evidence_ids", [])
    evidence_info = context.get("evidence_info", {})
    widget_states = context.get("widget_states", {})
    chat_history = context.get("chat_history", [])

    # 取得當前文檔資訊
    current_doc = None
    current_doc_title = None
    pdf_base64 = None
    
    if current_document_id:
        current_doc = db.query(models.Document).filter(
            models.Document.id == current_document_id
        ).first()
        
        if current_doc:
            current_doc_title = current_doc.title
            
            # 如果是 PDF 文檔，下載並轉換為 Base64
            if current_doc.type == "pdf" and current_doc.object_key:
                try:
                    # 從 MinIO 下載 PDF
                    pdf_content = download_file_from_minio(current_doc.object_key)
                    
                    # 檢查檔案大小
                    if len(pdf_content) > MAX_PDF_SIZE:
                        raise HTTPException(
                            status_code=413,
                            detail=f"PDF 檔案過大（{len(pdf_content) / (1024*1024):.1f}MB），無法進行 AI 分析（限制 50MB）"
                        )
                    
                    # 轉換為 Base64
                    pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
                    logger.info(f"PDF loaded for chat: {current_doc.title}, size: {len(pdf_content) / 1024:.1f}KB")
                    
                except Exception as e:
                    logger.error(f"Failed to load PDF for chat: {e}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"無法載入 PDF 檔案：{str(e)}"
                    )

    # 構建系統提示
    system_prompt_parts = [f"""你是論文寫作教練，正在指導學生完成「{node_label}」任務。

當前任務說明：{node_guidance}"""]

    # 加入當前文檔資訊
    if current_doc_title:
        system_prompt_parts.append(f"\n當前討論文檔：《{current_doc_title}》")
        if pdf_base64:
            system_prompt_parts.append("\n你可以直接閱讀並分析這份 PDF 文檔的完整內容。")

    system_prompt_parts.append("""

你的角色：
1. 提供引導性問題，幫助學生思考
2. 檢核學生的填寫是否符合要求（如是否有證據支持）
3. 指出需要改進的地方，但不要直接代寫
4. 根據學生的進度給予適當的鼓勵或提醒
5. 引用文檔中具體的內容和頁碼來支持你的回答

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
    
    # 儲存用戶訊息到資料庫
    user_message = models.ChatMessage(
        project_id=project_id,
        user_id=current_user.id,
        role="user",
        content=payload.message,
        context={
            "current_document_id": current_document_id,
            "evidence_ids": evidence_ids,
            "evidence_info": evidence_info,
            "node_id": payload.node_id
        }
    )
    db.add(user_message)
    db.commit()
    
    # 調用 Azure OpenAI（使用 Responses API 處理 PDF）
    if pdf_base64:
        # 有 PDF 時使用 Responses API
        azure = AzureResponsesAPIClient()
        response = await azure.chat_with_pdf(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            pdf_base64=pdf_base64,
            filename=current_doc.title
        )
    else:
        # 無 PDF 時使用標準 Chat API（保留向後相容）
        from services import AzureOpenAIClient
        azure = AzureOpenAIClient()
        response = await azure.chat(system_prompt, user_prompt)
    
    # 儲存 AI 回覆到資料庫
    ai_message = models.ChatMessage(
        project_id=project_id,
        user_id=current_user.id,
        role="coach",
        content=response,
        context={
            "current_document_id": current_document_id,
            "node_id": payload.node_id
        }
    )
    db.add(ai_message)
    db.commit()
    
    return schemas.ChatResponse(message=response, role="ai")

@router.get("/{project_id}/chat", response_model=list[schemas.ChatMessageOut])
def get_chat_history(
    project_id: str,
    step_id: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    獲取專案的對話歷史記錄
    """
    # 驗證專案存在
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 查詢該用戶在該專案的所有對話記錄
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.project_id == project_id,
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.asc()).all()
    
    # 轉換為輸出格式
    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "project_id": msg.project_id,
            "user_id": msg.user_id,
            "user_name": current_user.name,
            "role": msg.role,
            "content": msg.content,
            "context": msg.context or {},
            "created_at": int(msg.created_at.timestamp() * 1000)
        })
    
    return result
