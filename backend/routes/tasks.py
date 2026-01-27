from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
from services import AzureOpenAIClient
import json

router = APIRouter(prefix="/api/projects", tags=["tasks"])

# Task A: 單篇論文摘要
TASK_A_SYSTEM_PROMPT = """你是一位專業的論文閱讀助手，負責評估學生對單篇論文的摘要。

【評估標準】
1. 研究目的：是否清楚說明研究問題？
2. 研究方法：是否正確描述研究方法？
3. 主要發現：是否準確歸納核心結論？
4. 研究限制：是否指出作者自述或觀察到的限制？
5. 證據支持：每個欄位是否有引用論文中的具體段落作為證據？

【回饋規範】
- 使用繁體中文
- 先肯定做得好的部分，再指出需要改進之處
- 具體說明哪些內容需要補充或修正
- 回覆控制在 200-400 字以內"""

# Task B: 跨篇論文比較
TASK_B_SYSTEM_PROMPT = """你是一位專業的論文閱讀助手，負責評估學生的跨篇論文比較表。

【評估標準】
1. 比較維度：選擇的維度是否有意義？（如：研究方法、樣本對象、主要發現等）
2. 內容準確性：對每篇論文的描述是否正確？
3. 對比清晰度：兩篇論文之間的差異是否清楚呈現？
4. 證據支持：每個描述是否有引用論文中的具體段落？

【回饋規範】
- 使用繁體中文
- 先肯定做得好的部分，再指出需要改進之處
- 如果比較維度不夠深入，建議更有意義的維度
- 回覆控制在 200-400 字以內"""

# Task C: 綜合分析
TASK_C_SYSTEM_PROMPT = """你是一位專業的論文閱讀助手，負責評估學生的跨篇綜合分析。

【評估標準】
1. 主題句：是否清楚說明段落要探討的核心主題？
2. 跨篇證據：是否綜合多篇文獻的觀察，而非只引用單篇？
3. 差異界線：是否指出不同論文之間的對立點或適用範圍？
4. 研究缺口：是否識別出目前研究尚未解決的問題或機會？

【回饋規範】
- 使用繁體中文
- 先肯定做得好的部分，再指出需要改進之處
- 特別注意學生是否真正做到「綜合」而非只是「並列」
- 回覆控制在 200-400 字以內"""

@router.post("/{project_id}/tasks/A", response_model=schemas.TaskResponse)
async def submit_task_a(
    project_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    target_doc_id = payload.get("target_doc_id")
    content = payload.get("content", {})
    
    version = db.query(models.TaskVersion).filter(
        models.TaskVersion.project_id == project_id,
        models.TaskVersion.task_type == "A",
        models.TaskVersion.target_doc_id == target_doc_id,
    ).count() + 1
    
    tv = models.TaskVersion(
        project_id=project_id,
        user_id=current_user.id,
        target_doc_id=target_doc_id,
        task_type="A",
        version=version,
        content=content,
        is_valid=True,
        validation_errors=[],
    )
    
    # Call Azure for feedback
    azure = AzureOpenAIClient()
    user_prompt = f"""【學生提交的單篇論文摘要】

{json.dumps(content, ensure_ascii=False, indent=2)}

請根據評估標準提供回饋。"""
    feedback = await azure.chat(TASK_A_SYSTEM_PROMPT, user_prompt)
    tv.feedback = feedback
    
    db.add(tv)
    db.commit()
    db.refresh(tv)
    return schemas.TaskResponse(
        id=tv.id,
        feedback=tv.feedback,
        is_valid=tv.is_valid,
        validation_errors=tv.validation_errors or []
    )

@router.post("/{project_id}/tasks/B", response_model=schemas.TaskResponse)
async def submit_task_b(
    project_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    content = payload.get("content", [])
    
    version = db.query(models.TaskVersion).filter(
        models.TaskVersion.project_id == project_id,
        models.TaskVersion.task_type == "B",
    ).count() + 1
    
    tv = models.TaskVersion(
        project_id=project_id,
        user_id=current_user.id,
        target_doc_id=None,
        task_type="B",
        version=version,
        content=content,
        is_valid=True,
        validation_errors=[],
    )
    
    # Call Azure for feedback
    azure = AzureOpenAIClient()
    user_prompt = f"""【學生提交的跨篇論文比較表】

{json.dumps(content, ensure_ascii=False, indent=2)}

請根據評估標準提供回饋。"""
    feedback = await azure.chat(TASK_B_SYSTEM_PROMPT, user_prompt)
    tv.feedback = feedback
    
    db.add(tv)
    db.commit()
    db.refresh(tv)
    return schemas.TaskResponse(
        id=tv.id,
        feedback=tv.feedback,
        is_valid=tv.is_valid,
        validation_errors=tv.validation_errors or []
    )

@router.post("/{project_id}/tasks/C", response_model=schemas.TaskResponse)
async def submit_task_c(
    project_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    content = payload.get("content", {})
    
    version = db.query(models.TaskVersion).filter(
        models.TaskVersion.project_id == project_id,
        models.TaskVersion.task_type == "C",
    ).count() + 1
    
    tv = models.TaskVersion(
        project_id=project_id,
        user_id=current_user.id,
        target_doc_id=None,
        task_type="C",
        version=version,
        content=content,
        is_valid=True,
        validation_errors=[],
    )
    
    # Call Azure for feedback
    azure = AzureOpenAIClient()
    user_prompt = f"""【學生提交的綜合分析】

{json.dumps(content, ensure_ascii=False, indent=2)}

請根據評估標準提供回饋。"""
    feedback = await azure.chat(TASK_C_SYSTEM_PROMPT, user_prompt)
    tv.feedback = feedback
    
    db.add(tv)
    db.commit()
    db.refresh(tv)
    return schemas.TaskResponse(
        id=tv.id,
        feedback=tv.feedback,
        is_valid=tv.is_valid,
        validation_errors=tv.validation_errors or []
    )
