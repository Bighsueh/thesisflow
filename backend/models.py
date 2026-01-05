import json
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text, UniqueConstraint, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from db import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    semester = Column(String, nullable=True)
    tags = Column(JSONB, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    flow_nodes = relationship("FlowNode", cascade="all, delete-orphan", back_populates="project")
    flow_edges = relationship("FlowEdge", cascade="all, delete-orphan", back_populates="project")
    documents = relationship("Document", cascade="all, delete-orphan", back_populates="project")
    task_versions = relationship("TaskVersion", cascade="all, delete-orphan", back_populates="project")
    cohorts = relationship("Cohort", cascade="all, delete-orphan", back_populates="project")


class FlowNode(Base):
    __tablename__ = "flow_nodes"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    type = Column(String, nullable=False)
    label = Column(String, nullable=False)
    config = Column(JSONB, default=dict)
    position = Column(JSONB, default=dict)

    project = relationship("Project", back_populates="flow_nodes")


class FlowEdge(Base):
    __tablename__ = "flow_edges"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    source = Column(String, nullable=False)
    target = Column(String, nullable=False)
    data = Column(JSONB, default=dict)

    project = relationship("Project", back_populates="flow_edges")


class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    object_key = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    size = Column(Integer, nullable=True)
    type = Column(String, nullable=False, default="text")
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    raw_preview = Column(Text, nullable=True)

    # RAG 相關欄位
    rag_status = Column(String, default="pending")  # pending|processing|completed|failed
    rag_error = Column(Text, nullable=True)  # RAG 處理錯誤訊息
    chunk_count = Column(Integer, default=0)  # 切分後的 chunk 數量

    project = relationship("Project", back_populates="documents")
    highlights = relationship("Highlight", cascade="all, delete-orphan", back_populates="document")
    chunks = relationship("DocumentChunk", cascade="all, delete-orphan", back_populates="document")
    rag_logs = relationship("RagProcessingLog", cascade="all, delete-orphan", back_populates="document")


class Highlight(Base):
    __tablename__ = "highlights"
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"))
    snippet = Column(Text, nullable=False)
    name = Column(String, nullable=True)  # 標記片段名稱，使用者自訂
    page = Column(Integer, nullable=True)
    x = Column(Float, nullable=True)  # 相對座標 0-1
    y = Column(Float, nullable=True)  # 相對座標 0-1
    width = Column(Float, nullable=True)  # 相對寬度 0-1
    height = Column(Float, nullable=True)  # 相對高度 0-1
    evidence_type = Column(String, nullable=True)  # Purpose/Method/Findings/Limitation/Other (保留以向後相容)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="highlights")


class TaskVersion(Base):
    __tablename__ = "task_versions"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    # 可為空，舊資料不一定有紀錄是哪位學生提交
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_doc_id = Column(String, nullable=True)
    task_type = Column(String, nullable=False)  # A/B/C
    version = Column(Integer, default=1)
    content = Column(JSONB, default=dict)
    feedback = Column(Text, nullable=True)
    is_valid = Column(Boolean, default=False)
    validation_errors = Column(JSONB, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="task_versions")


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # teacher | student
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    cohorts = relationship("Cohort", back_populates="teacher")
    memberships = relationship("CohortMember", back_populates="user")


class Cohort(Base):
    __tablename__ = "cohorts"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    teacher_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="cohorts")
    teacher = relationship("User", back_populates="cohorts")
    members = relationship("CohortMember", cascade="all, delete-orphan", back_populates="cohort")


class CohortMember(Base):
    __tablename__ = "cohort_members"
    id = Column(String, primary_key=True, default=generate_uuid)
    cohort_id = Column(String, ForeignKey("cohorts.id", ondelete="CASCADE"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    status = Column(String, nullable=True)  # active | blocked | done
    progress = Column(Integer, default=0)

    cohort = relationship("Cohort", back_populates="members")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (UniqueConstraint("cohort_id", "user_id", name="uq_cohort_member"),)


class WorkflowState(Base):
    __tablename__ = "workflow_states"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    node_id = Column(String, nullable=False)  # 當前節點 ID
    widget_state = Column(JSONB, default=dict)  # Widget 狀態
    task_b_data = Column(JSONB, default=list)  # Task B 數據
    task_c_data = Column(JSONB, default=dict)  # Task C 數據
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project")
    user = relationship("User")

    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_workflow_state"),)


class DocumentChunk(Base):
    """
    文檔切片記錄

    儲存 RAG 處理後的文檔切片資訊（向量儲存在 ChromaDB 中）
    """
    __tablename__ = "document_chunks"
    id = Column(String, primary_key=True)  # 格式: {document_id}_{chunk_index}
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)  # 切片索引（0-indexed）
    content_preview = Column(String(200), nullable=True)  # 內容預覽（前 200 字元）
    page_numbers = Column(JSONB, default=list)  # 涵蓋的頁碼列表
    char_count = Column(Integer, default=0)  # 字元數
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")


class RagProcessingLog(Base):
    __tablename__ = "rag_processing_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String, nullable=False)  # upload, parsing, chunking, embedding, indexing, complete, failed
    status = Column(String, nullable=False)  # pending, success, error
    message = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSONB, default=dict)  # 'metadata' is reserved in SQLAlchemy Base
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="rag_logs")

