from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from db import get_db
import models
from auth import get_current_user
from datetime import datetime, timedelta
from typing import Optional
from collections import Counter

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def get_cohort_project_ids(db: Session, cohort_id: str) -> list[str]:
    """獲取群組相關的所有專案 ID（支持新舊兩種架構）"""
    project_ids = set()
    
    # 新架構：Project.cohort_id
    new_projects = db.query(models.Project.id).filter(
        models.Project.cohort_id == cohort_id
    ).all()
    project_ids.update([p.id for p in new_projects])
    
    # 舊架構：Cohort.project_id
    cohort = db.query(models.Cohort).filter(
        models.Cohort.id == cohort_id
    ).first()
    if cohort and cohort.project_id:
        project_ids.add(cohort.project_id)
    
    return list(project_ids)


@router.get("/{cohort_id}/overview")
def get_overview(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 1: 總覽統計"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組成員
    members = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()
    
    member_ids = [m.user_id for m in members]
    total_students = len(member_ids)
    
    if total_students == 0:
        return {
            "totalStudents": 0,
            "activeToday": 0,
            "totalHighlights": 0,
            "avgProgress": 0
        }
    
    # 今日活躍學生數（有更新 TaskState 或新增 Highlight）
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    active_from_tasks = db.query(distinct(models.TaskState.user_id)).filter(
        models.TaskState.user_id.in_(member_ids),
        models.TaskState.updated_at >= today_start
    ).count()
    
    # 取得群組相關專案 ID（支持新舊架構）
    project_ids = get_cohort_project_ids(db, cohort_id)
    
    active_from_highlights = 0
    if project_ids:
        active_from_highlights = db.query(distinct(models.Highlight.id)).join(
            models.Document
        ).filter(
            models.Document.project_id.in_(project_ids),
            models.Highlight.created_at >= today_start
        ).count()
    
    active_today = active_from_tasks + (1 if active_from_highlights > 0 else 0)
    
    # 總 Highlight 數量
    total_highlights = 0
    if project_ids:
        total_highlights = db.query(models.Highlight).join(
            models.Document
        ).filter(
            models.Document.project_id.in_(project_ids)
        ).count()
    
    # 平均進度
    avg_progress = sum([m.progress for m in members]) / total_students if total_students > 0 else 0
    
    return {
        "totalStudents": total_students,
        "activeToday": active_today,
        "totalHighlights": total_highlights,
        "avgProgress": round(avg_progress, 1)
    }


@router.get("/{cohort_id}/task-matrix")
def get_task_matrix(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 2: 任務進度矩陣"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組成員
    members = db.query(models.CohortMember).join(models.User).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()
    
    result = []
    for member in members:
        user = db.query(models.User).filter(models.User.id == member.user_id).first()
        if not user:
            continue
        
        # 取得該學生的 TaskState
        task_state = db.query(models.TaskState).filter(
            models.TaskState.user_id == member.user_id
        ).first()
        
        # 判斷摘要任務狀態
        summary_status = "not_started"
        if task_state and task_state.summary_state:
            sections = task_state.summary_state
            if isinstance(sections, dict) and len(sections) > 0:
                filled = sum(1 for s in sections.values() 
                           if isinstance(s, dict) and s.get('text', '').strip() 
                           and len(s.get('snippetIds', [])) > 0)
                total = len(sections)
                if filled == 0:
                    summary_status = "not_started"
                elif filled == total:
                    summary_status = "complete"
                elif filled >= total * 0.7:
                    summary_status = "nearly_complete"
                else:
                    summary_status = "in_progress"
        
        # 判斷比較任務狀態
        comparison_status = "not_started"
        if task_state and task_state.comparison_state:
            rows = task_state.comparison_state
            if isinstance(rows, list) and len(rows) > 0:
                complete_rows = sum(1 for r in rows 
                                  if isinstance(r, dict) 
                                  and r.get('dimension', '').strip()
                                  and r.get('similarity', '').strip()
                                  and r.get('difference', '').strip())
                if complete_rows == 0:
                    comparison_status = "not_started"
                elif complete_rows == len(rows) and len(rows) >= 3:
                    comparison_status = "complete"
                elif complete_rows > 0:
                    comparison_status = "in_progress"
        
        # 最後活躍時間
        last_active = task_state.updated_at if task_state else None
        
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "summaryStatus": summary_status,
            "comparisonStatus": comparison_status,
            "lastActive": int(last_active.timestamp() * 1000) if last_active else None
        })
    
    return {"students": result}


@router.get("/{cohort_id}/word-cloud")
def get_word_cloud(
    cohort_id: str,
    document_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 3: 文字雲數據（基於學生對話內容）"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    try:
        import jieba
    except ImportError:
        return {"words": [], "error": "jieba not installed"}
    
    # 取得群組成員
    member_ids = [m.user_id for m in db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()]
    
    if len(member_ids) == 0:
        return {"words": []}
    
    # 從 ChatMessage 獲取學生對話內容（role='user'）
    query = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id.in_(member_ids),
        models.ChatMessage.role == "user"
    )
    
    # 如果指定了文檔，僅分析該文檔相關的對話
    if document_id:
        query = query.join(models.Project).join(models.Document).filter(
            models.Document.id == document_id
        )
    else:
        # 否則僅分析該群組的專案對話（支持新舊架構）
        project_ids = get_cohort_project_ids(db, cohort_id)
        if len(project_ids) > 0:
            query = query.filter(models.ChatMessage.project_id.in_(project_ids))
    
    messages = query.all()
    
    # 中文分詞
    word_freq = Counter()
    stopwords = {'的', '是', '了', '在', '和', '有', '為', '與', '等', '及', '或', '但', '而', '就', '都', '可以', '這', '也', '會', '對', '從', '要', '不', '能', '之', '以', '上', '中', '下', '被', '將', '其', '於', '如', '由', '因', '到', '很', '該', '此', '後', '所', '把', '更', '且', '至', '給', '只', '使', '讓', '向', '再', '來', '去', '們', '我', '你', '他', '她', '它', '嗎', '呢', '吧', '啊', '哦', '喔'}
    
    for msg in messages:
        words = jieba.cut(msg.content, cut_all=False)
        for word in words:
            word = word.strip()
            if len(word) > 1 and word not in stopwords:
                word_freq[word] += 1
    
    # 返回前 100 個高頻詞
    words = [{"text": k, "value": v} for k, v in 
             sorted(word_freq.items(), key=lambda x: -x[1])[:100]]
    
    return {"words": words}


@router.get("/{cohort_id}/activity-trend")
def get_activity_trend(
    cohort_id: str,
    period: str = Query("7d", regex="^(7d|30d|all)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 4: 學生活動趨勢"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 計算時間範圍
    if period == "7d":
        start_date = datetime.utcnow() - timedelta(days=7)
    elif period == "30d":
        start_date = datetime.utcnow() - timedelta(days=30)
    else:
        start_date = datetime.utcnow() - timedelta(days=90)
    
    # 取得群組成員
    member_ids = [m.user_id for m in db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()]
    
    # 統計 TaskState 更新
    task_edits = db.query(
        func.date(models.TaskState.updated_at).label('date'),
        func.count().label('count')
    ).filter(
        models.TaskState.user_id.in_(member_ids),
        models.TaskState.updated_at >= start_date
    ).group_by(func.date(models.TaskState.updated_at)).all()
    
    # 取得群組相關專案 ID（支持新舊架構）
    project_ids = get_cohort_project_ids(db, cohort_id)
    
    # 統計 Highlight 建立
    highlights = []
    if project_ids:
        highlights = db.query(
            func.date(models.Highlight.created_at).label('date'),
            func.count().label('count')
        ).join(models.Document).filter(
            models.Document.project_id.in_(project_ids),
            models.Highlight.created_at >= start_date
        ).group_by(func.date(models.Highlight.created_at)).all()
    
    # 統計 ChatMessage（學生對話）
    
    chat_messages = []
    if len(member_ids) > 0 and len(project_ids) > 0:
        chat_messages = db.query(
            func.date(models.ChatMessage.created_at).label('date'),
            func.count().label('count')
        ).filter(
            models.ChatMessage.user_id.in_(member_ids),
            models.ChatMessage.project_id.in_(project_ids),
            models.ChatMessage.role == "user",  # 僅統計學生發送的訊息
            models.ChatMessage.created_at >= start_date
        ).group_by(func.date(models.ChatMessage.created_at)).all()
    
    # 合併結果
    date_map = {}
    for item in task_edits:
        date_str = item.date.strftime('%Y-%m-%d')
        date_map[date_str] = date_map.get(date_str, {"date": date_str, "taskEdits": 0, "highlightsCreated": 0, "chatMessages": 0})
        date_map[date_str]["taskEdits"] = item.count
    
    for item in highlights:
        date_str = item.date.strftime('%Y-%m-%d')
        date_map[date_str] = date_map.get(date_str, {"date": date_str, "taskEdits": 0, "highlightsCreated": 0, "chatMessages": 0})
        date_map[date_str]["highlightsCreated"] = item.count
    
    for item in chat_messages:
        date_str = item.date.strftime('%Y-%m-%d')
        date_map[date_str] = date_map.get(date_str, {"date": date_str, "taskEdits": 0, "highlightsCreated": 0, "chatMessages": 0})
        date_map[date_str]["chatMessages"] = item.count
    
    daily = sorted(date_map.values(), key=lambda x: x["date"])
    
    return {"daily": daily, "period": period}


@router.get("/{cohort_id}/evidence-stats")
def get_evidence_stats(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 5: Evidence 標記統計"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組相關專案 ID（支持新舊架構）
    project_ids = get_cohort_project_ids(db, cohort_id)
    
    # 取得所有 Highlights
    highlights = []
    if project_ids:
        highlights = db.query(models.Highlight).join(models.Document).filter(
            models.Document.project_id.in_(project_ids)
        ).all()
    
    # 按學生統計
    student_highlights = {}
    for h in highlights:
        # 透過 document 找到相關的 TaskState，再找到 user
        doc = db.query(models.Document).filter(models.Document.id == h.document_id).first()
        if doc:
            # Highlight 沒有直接關聯 user，我們需要透過其他方式推斷
            # 暫時先統計總數
            pass
    
    # 簡化版：僅返回總體統計
    total = len(highlights)
    
    # 按類型統計
    by_type = {
        "Purpose": 0,
        "Method": 0,
        "Findings": 0,
        "Limitation": 0,
        "Other": 0
    }
    
    for h in highlights:
        evidence_type = h.evidence_type or "Other"
        if evidence_type in by_type:
            by_type[evidence_type] += 1
        else:
            by_type["Other"] += 1
    
    return {
        "total": total,
        "byType": by_type
    }


@router.get("/{cohort_id}/document-usage")
def get_document_usage(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 6: 文獻使用熱度"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組相關專案 ID（支持新舊架構）
    project_ids = get_cohort_project_ids(db, cohort_id)
    
    # 取得群組相關專案的文檔
    documents = []
    if project_ids:
        documents = db.query(models.Document).filter(
            models.Document.project_id.in_(project_ids)
        ).all()
    
    result = []
    for doc in documents:
        # 統計該文檔的 Highlight 數量
        highlight_count = db.query(models.Highlight).filter(
            models.Highlight.document_id == doc.id
        ).count()
        
        # 統計有多少學生使用過（簡化版：透過 highlight 存在來推斷）
        # 實際上 Highlight 沒有 user_id，這裡僅做估算
        
        result.append({
            "id": doc.id,
            "title": doc.title,
            "highlightCount": highlight_count,
            "ragStatus": doc.rag_status
        })
    
    # 按 highlight 數量排序
    result.sort(key=lambda x: x["highlightCount"], reverse=True)
    
    return {"documents": result}


@router.get("/{cohort_id}/page-heatmap/{document_id}")
def get_page_heatmap(
    cohort_id: str,
    document_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 7: 頁碼熱力圖"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組相關專案 ID（支持新舊架構）
    project_ids = get_cohort_project_ids(db, cohort_id)
    
    # 驗證文檔屬於該群組
    doc = None
    if project_ids:
        doc = db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.project_id.in_(project_ids)
        ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 統計每頁的 Highlight 數量
    highlights = db.query(models.Highlight).filter(
        models.Highlight.document_id == document_id,
        models.Highlight.page.isnot(None)
    ).all()
    
    page_counts = {}
    for h in highlights:
        page = h.page
        page_counts[page] = page_counts.get(page, 0) + 1
    
    # 找出最大值用於正規化
    max_count = max(page_counts.values()) if page_counts else 1
    
    pages = [
        {
            "page": page,
            "highlightCount": count,
            "intensity": count / max_count
        }
        for page, count in sorted(page_counts.items())
    ]
    
    return {
        "documentId": document_id,
        "documentTitle": doc.title,
        "pages": pages
    }


@router.get("/{cohort_id}/editing-depth")
def get_editing_depth(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 8: 編輯深度分析"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組成員
    members = db.query(models.CohortMember).join(models.User).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()
    
    result = []
    for member in members:
        user = db.query(models.User).filter(models.User.id == member.user_id).first()
        if not user:
            continue
        
        task_state = db.query(models.TaskState).filter(
            models.TaskState.user_id == member.user_id
        ).first()
        
        # 計算摘要字數
        summary_word_count = 0
        if task_state and task_state.summary_state:
            for section in task_state.summary_state.values():
                if isinstance(section, dict):
                    text = section.get('text', '')
                    summary_word_count += len(text)
        
        # 計算比較行數
        comparison_rows = 0
        if task_state and task_state.comparison_state:
            comparison_rows = len(task_state.comparison_state)
        
        # 計算使用的 Evidence 數量
        total_evidence = 0
        if task_state:
            if task_state.summary_state:
                for section in task_state.summary_state.values():
                    if isinstance(section, dict):
                        total_evidence += len(section.get('snippetIds', []))
            if task_state.comparison_state:
                for row in task_state.comparison_state:
                    if isinstance(row, dict):
                        total_evidence += len(row.get('doc1Claim', {}).get('snippetIds', []))
                        total_evidence += len(row.get('doc2Claim', {}).get('snippetIds', []))
        
        last_edit = task_state.updated_at if task_state else None
        
        result.append({
            "studentName": user.name,
            "summaryWordCount": summary_word_count,
            "comparisonRows": comparison_rows,
            "totalEvidenceUsed": total_evidence,
            "lastEditAt": int(last_edit.timestamp() * 1000) if last_edit else None
        })
    
    return {"students": result}


@router.get("/{cohort_id}/feedback-summary")
def get_feedback_summary(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 9: AI 回饋摘要"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組成員
    member_ids = [m.user_id for m in db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()]
    
    # 取得 TaskVersion 的 feedback
    task_versions = db.query(models.TaskVersion).filter(
        models.TaskVersion.user_id.in_(member_ids),
        models.TaskVersion.feedback.isnot(None)
    ).order_by(models.TaskVersion.created_at.desc()).limit(50).all()
    
    # 簡化版：提取常見關鍵詞
    feedback_texts = [tv.feedback for tv in task_versions if tv.feedback]
    
    # 提取常見短語（簡化版）
    common_phrases = []
    phrase_keywords = ["需要", "建議", "可以", "應該", "缺少", "不足", "改進"]
    for feedback in feedback_texts:
        for keyword in phrase_keywords:
            if keyword in feedback:
                # 提取包含關鍵詞的句子片段
                sentences = feedback.split('。')
                for sentence in sentences:
                    if keyword in sentence and len(sentence) < 50:
                        common_phrases.append(sentence.strip())
    
    # 統計出現頻率
    phrase_counter = Counter(common_phrases)
    common_suggestions = [
        {"keyword": phrase, "count": count}
        for phrase, count in phrase_counter.most_common(10)
    ]
    
    # 最近的回饋
    recent_feedbacks = []
    for tv in task_versions[:10]:
        user = db.query(models.User).filter(models.User.id == tv.user_id).first()
        if user:
            recent_feedbacks.append({
                "studentName": user.name,
                "taskType": tv.task_type,
                "feedbackPreview": tv.feedback[:100] if tv.feedback else "",
                "timestamp": int(tv.created_at.timestamp() * 1000)
            })
    
    return {
        "commonSuggestions": common_suggestions,
        "recentFeedbacks": recent_feedbacks
    }


@router.get("/{cohort_id}/activity-timeline")
def get_activity_timeline(
    cohort_id: str,
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 10: 活動時間分布"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 取得群組成員
    member_ids = [m.user_id for m in db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()]
    
    # 統計每小時的活動
    task_updates = db.query(models.TaskState).filter(
        models.TaskState.user_id.in_(member_ids),
        models.TaskState.updated_at >= start_date
    ).all()
    
    # 取得群組相關專案 ID（支持新舊架構）
    project_ids = get_cohort_project_ids(db, cohort_id)
    
    highlights = []
    if project_ids:
        highlights = db.query(models.Highlight).join(models.Document).filter(
            models.Document.project_id.in_(project_ids),
            models.Highlight.created_at >= start_date
        ).all()
    
    # 統計 ChatMessage（學生對話）
    
    chat_messages = []
    if len(member_ids) > 0 and len(project_ids) > 0:
        chat_messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.user_id.in_(member_ids),
            models.ChatMessage.project_id.in_(project_ids),
            models.ChatMessage.role == "user",  # 僅統計學生發送的訊息
            models.ChatMessage.created_at >= start_date
        ).all()
    
    # 統計每小時的活動量
    hourly = [0] * 24
    for task in task_updates:
        hour = task.updated_at.hour
        hourly[hour] += 1
    
    for h in highlights:
        hour = h.created_at.hour
        hourly[hour] += 1
    
    for msg in chat_messages:
        hour = msg.created_at.hour
        hourly[hour] += 1
    
    hourly_data = [{"hour": i, "count": count} for i, count in enumerate(hourly)]
    
    return {"hourly": hourly_data}


@router.get("/{cohort_id}/comparison-dimensions")
def get_comparison_dimensions(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """區塊 11: 比較任務維度分析"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組成員
    member_ids = [m.user_id for m in db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()]
    
    # 統計所有學生使用的比較維度
    dimension_counter = Counter()
    
    task_states = db.query(models.TaskState).filter(
        models.TaskState.user_id.in_(member_ids)
    ).all()
    
    for ts in task_states:
        if ts.comparison_state and isinstance(ts.comparison_state, list):
            for row in ts.comparison_state:
                if isinstance(row, dict):
                    dimension = row.get('dimension', '').strip()
                    if dimension:
                        dimension_counter[dimension] += 1
    
    # 轉換為列表
    dimensions = [
        {"name": dim, "usageCount": count}
        for dim, count in dimension_counter.most_common(20)
    ]
    
    return {"dimensions": dimensions}


@router.get("/{cohort_id}/chat-logs")
def get_chat_logs(
    cohort_id: str,
    student_id: Optional[str] = None,
    project_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    獲取群組學生的對話記錄
    
    可選篩選條件：
    - student_id: 特定學生
    - project_id: 特定專案
    - limit: 返回數量限制
    """
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access analytics")
    
    # 取得群組成員
    member_ids = [m.user_id for m in db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()]
    
    if len(member_ids) == 0:
        return {"messages": []}
    
    # 構建查詢
    query = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id.in_(member_ids)
    )
    
    # 如果指定了學生 ID，只查詢該學生
    if student_id:
        if student_id not in member_ids:
            raise HTTPException(status_code=403, detail="Student is not in this cohort")
        query = query.filter(models.ChatMessage.user_id == student_id)
    
    # 取得群組相關專案 ID（支持新舊架構）
    project_ids = get_cohort_project_ids(db, cohort_id)
    
    # 如果指定了專案 ID，只查詢該專案
    if project_id:
        # 驗證專案屬於該群組
        if project_id not in project_ids:
            raise HTTPException(status_code=404, detail="Project not found in this cohort")
        query = query.filter(models.ChatMessage.project_id == project_id)
    else:
        # 如果沒有指定專案，則查詢該群組所有專案
        if len(project_ids) > 0:
            query = query.filter(models.ChatMessage.project_id.in_(project_ids))
    
    # 按時間倒序排列並限制數量
    messages = query.order_by(models.ChatMessage.created_at.desc()).limit(limit).all()
    
    # 轉換為輸出格式，附加學生和專案資訊
    result = []
    for msg in messages:
        user = db.query(models.User).filter(models.User.id == msg.user_id).first()
        project = db.query(models.Project).filter(models.Project.id == msg.project_id).first()
        
        result.append({
            "id": msg.id,
            "project_id": msg.project_id,
            "project_title": project.title if project else "未知專案",
            "user_id": msg.user_id,
            "user_name": user.name if user else "未知學生",
            "role": msg.role,
            "content": msg.content,
            "context": msg.context or {},
            "created_at": int(msg.created_at.timestamp() * 1000)
        })
    
    return {"messages": result, "total": len(result)}
