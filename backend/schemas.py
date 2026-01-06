from __future__ import annotations
from typing import List, Optional, Any, TYPE_CHECKING
from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from typing import ForwardRef


class FlowNodePayload(BaseModel):
    id: str
    type: str
    label: str
    config: dict | None = None
    position: dict | None = None


class FlowEdgePayload(BaseModel):
    id: str
    source: str
    target: str
    data: dict | None = None


class ProjectCreate(BaseModel):
    title: str
    semester: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    nodes: List[FlowNodePayload] = Field(default_factory=list)
    edges: List[FlowEdgePayload] = Field(default_factory=list)


class ProjectUpdate(ProjectCreate):
    pass


class ProjectOut(BaseModel):
    id: str
    title: str
    semester: Optional[str]
    tags: List[str]
    nodes: List[FlowNodePayload]
    edges: List[FlowEdgePayload]

    class Config:
        from_attributes = True


class DocumentCreate(BaseModel):
    project_id: Optional[str] = None
    title: str
    object_key: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    type: str = "text"
    raw_preview: Optional[str] = None


class DocumentUpdate(BaseModel):
    project_id: Optional[str] = None


class DocumentOut(BaseModel):
    id: str
    project_id: Optional[str] = None
    title: str
    object_key: str
    content_type: Optional[str]
    size: Optional[int]
    type: str
    uploaded_at: int
    raw_preview: Optional[str] = None
    highlights: List["HighlightOut"] = Field(default_factory=list)
    # RAG 相關欄位
    rag_status: str = "pending"  # pending|processing|completed|failed
    chunk_count: int = 0

    class Config:
        from_attributes = True


class DocumentChunkOut(BaseModel):
    """文檔切片輸出格式"""
    id: str
    document_id: str
    chunk_index: int
    content_preview: Optional[str] = None
    page_numbers: List[int] = Field(default_factory=list)
    char_count: int = 0
    created_at: int

    class Config:
        from_attributes = True


class HighlightCreate(BaseModel):
    document_id: str
    snippet: str
    name: Optional[str] = None  # 標記片段名稱，使用者自訂
    page: Optional[int] = None
    x: Optional[float] = None  # 相對座標 0-1
    y: Optional[float] = None  # 相對座標 0-1
    width: Optional[float] = None  # 相對寬度 0-1
    height: Optional[float] = None  # 相對高度 0-1
    evidence_type: Optional[str] = None  # Purpose/Method/Findings/Limitation/Other (保留以向後相容)


class HighlightUpdate(BaseModel):
    snippet: Optional[str] = None
    name: Optional[str] = None  # 標記片段名稱，使用者自訂
    page: Optional[int] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    evidence_type: Optional[str] = None


class HighlightOut(BaseModel):
    id: str
    document_id: str
    snippet: str
    name: Optional[str] = None  # 標記片段名稱，使用者自訂
    page: Optional[int]
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    evidence_type: Optional[str] = None
    created_at: int

    class Config:
        from_attributes = True


class TaskRequest(BaseModel):
    project_id: str
    target_doc_id: Optional[str] = None
    task_type: str
    content: Any


class TaskResponse(BaseModel):
    id: str
    feedback: Optional[str]
    is_valid: bool
    validation_errors: List[str] = []

    class Config:
        from_attributes = True


class PresignRequest(BaseModel):
    filename: str
    content_type: str = "text/plain"


class PresignResponse(BaseModel):
    upload_url: str
    object_key: str


class PresignGetRequest(BaseModel):
    object_key: str


class PresignGetResponse(BaseModel):
    download_url: str
    url: Optional[str] = None  # Alias for download_url for compatibility with frontend

    def __init__(self, **data):
        super().__init__(**data)
        # Ensure url field is always set to download_url value
        if self.url is None:
            self.url = self.download_url


class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


class StudentCreate(BaseModel):
    email: str
    name: str
    password: str


class BulkStudentCreate(BaseModel):
    start_no: int
    end_no: int
    name_prefix: str
    email_prefix: str
    email_domain: str
    password: str
    zero_pad: int = 2


class StudentUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str

    class Config:
        # Pydantic v2 uses from_attributes, v1 uses orm_mode
        try:
            from_attributes = True
        except:
            pass
        orm_mode = True


# Alias for compatibility
UserResponse = UserOut


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenWithUser(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CohortCreate(BaseModel):
    name: str
    code: Optional[str] = None
    project_id: Optional[str] = None


class CohortUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    project_id: Optional[str] = None


class CohortOut(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    project_id: Optional[str] = None
    created_at: int
    member_count: int = 0

    class Config:
        from_attributes = True


class CohortMemberOut(BaseModel):
    user: UserOut
    status: Optional[str]
    progress: int


class UsageOut(BaseModel):
    id: str
    user: UserOut
    project_id: str
    project_title: Optional[str] = None
    task_type: str
    created_at: int
    cohort_id: Optional[str] = None
    target_doc_id: Optional[str] = None


class ChatRequest(BaseModel):
    project_id: str
    node_id: str
    message: str
    context: dict  # 包含 current_document_id, evidence_ids, widget_states, chat_history
    # context = {
    #     "current_document_id": str | None,  # 當前查看的文檔 ID（用於 RAG 檢索）
    #     "evidence_ids": [...],
    #     "evidence_info": {...},
    #     "widget_states": {...},
    #     "chat_history": [...]
    # }


class ChatResponse(BaseModel):
    message: str
    role: str = "ai"


class WorkflowStateCreate(BaseModel):
    project_id: str
    node_id: str
    widget_state: dict = Field(default_factory=dict)
    task_b_data: list = Field(default_factory=list)
    task_c_data: dict = Field(default_factory=dict)


class WorkflowStateUpdate(BaseModel):
    node_id: Optional[str] = None
    widget_state: Optional[dict] = None
    task_b_data: Optional[list] = None
    task_c_data: Optional[dict] = None


class WorkflowStateOut(BaseModel):
    id: str
    project_id: str
    user_id: str
    node_id: str
    widget_state: dict
    task_b_data: list
    task_c_data: dict
    created_at: int
    updated_at: int

    class Config:
        from_attributes = True


class RagProcessingLogOut(BaseModel):
    id: str
    document_id: str
    stage: str
    status: str
    message: Optional[str] = None
    metadata_: dict = Field(default_factory=dict, alias="metadata")
    created_at: int

    class Config:
        from_attributes = True
        populate_by_name = True


# Rebuild forward refs (required for ForwardRef)
# This must be called after all models are defined
# Try Pydantic v2 method first, then fall back to v1
try:
    # Pydantic v2: use model_rebuild()
    DocumentOut.model_rebuild()
    HighlightOut.model_rebuild()
    ProjectOut.model_rebuild()
    TaskResponse.model_rebuild()
    RagProcessingLogOut.model_rebuild()
except (AttributeError, TypeError):
    # Pydantic v1: use update_forward_refs()
    try:
        DocumentOut.update_forward_refs()
        HighlightOut.update_forward_refs()
        ProjectOut.update_forward_refs()
        TaskResponse.update_forward_refs()
        RagProcessingLogOut.update_forward_refs()
    except (AttributeError, TypeError) as e:
        # If both fail, log but don't crash
        import warnings
        warnings.warn(f"Failed to rebuild forward refs: {e}")
