"""
RAG 模組入口

提供統一的 RAG 功能介面
"""

from .parsers import get_parser, ParseResult
from .chunking import chunk_text, Chunk, ChunkingConfig
from .embedding import get_embedding_client, AzureEmbeddingClient
from .vector_store import (
    get_vector_store,
    init_vector_store,
    VectorStore,
    SearchResult
)

__all__ = [
    # Parser
    "get_parser",
    "ParseResult",
    # Chunking
    "chunk_text",
    "Chunk",
    "ChunkingConfig",
    # Embedding
    "get_embedding_client",
    "AzureEmbeddingClient",
    # Vector Store
    "get_vector_store",
    "init_vector_store",
    "VectorStore",
    "SearchResult",
]
