"""
文本切分模組

將解析後的文本切分成適合向量化的小段落
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional, Set


@dataclass
class ChunkingConfig:
    """切分配置"""
    chunk_size: int = 500       # 每個 chunk 的目標字元數
    chunk_overlap: int = 50     # chunk 間的重疊字元數
    min_chunk_size: int = 100   # 最小 chunk 大小（避免過小的片段）


@dataclass
class Chunk:
    """切分結果"""
    index: int                          # chunk 索引（0-indexed）
    content: str                        # chunk 內容
    char_start: int                     # 在原文中的起始位置
    char_end: int                       # 在原文中的結束位置
    page_numbers: List[int] = field(default_factory=list)  # 涵蓋的頁碼


def chunk_text(
    content: str,
    pages: Optional[List[dict]] = None,
    config: Optional[ChunkingConfig] = None
) -> List[Chunk]:
    """
    將文本切分成多個 chunks

    Args:
        content: 完整文本（含 [Page N] 標記）
        pages: 按頁分割的內容列表（用於更精確的頁碼對應）
        config: 切分配置

    Returns:
        List[Chunk]: 切分後的 chunks
    """
    if not content or not content.strip():
        return []

    if config is None:
        config = ChunkingConfig()

    # 建立頁碼位置索引
    page_positions = _build_page_positions(content)

    # 執行切分
    chunks = _split_with_overlap(content, config, page_positions)

    return chunks


def _build_page_positions(content: str) -> List[tuple]:
    """
    從文本中提取頁碼標記位置（基於原始文本）

    Returns:
        List[tuple]: [(page_number, start_pos, end_pos), ...]
    """
    # 匹配 [Page N] 標記
    pattern = r'\[Page (\d+)\]'
    positions = []

    for match in re.finditer(pattern, content):
        page_num = int(match.group(1))
        start_pos = match.end()  # 頁碼標記結束後的位置
        positions.append((page_num, start_pos))

    # 計算每個頁面的結束位置
    result = []
    for i, (page_num, start_pos) in enumerate(positions):
        if i + 1 < len(positions):
            end_pos = positions[i + 1][1]
        else:
            end_pos = len(content)
        result.append((page_num, start_pos, end_pos))

    return result


def _build_clean_page_positions(content: str) -> List[tuple]:
    """
    建立清理後文本的頁碼位置索引

    將原始文本中的 [Page N] 標記位置映射到清理後（無標記）文本的位置，
    使得可以直接使用 clean_content 的 char_start/char_end 來查找頁碼。

    Args:
        content: 原始文本（含 [Page N] 標記）

    Returns:
        List[tuple]: [(page_number, clean_start, clean_end), ...]
        其中 clean_start/clean_end 是移除標記後的字元位置
    """
    pattern = r'\[Page (\d+)\]\n?'
    result: List[List] = []
    cumulative_removed = 0  # 累計移除的字元數
    last_match_end = 0

    for match in re.finditer(pattern, content):
        page_num = int(match.group(1))
        marker_start = match.start()
        marker_end = match.end()

        # 此標記前的文字長度（在原始文本中）
        text_before_len = marker_start - last_match_end
        # 此頁在清理後文本的起始位置
        clean_start = marker_start - cumulative_removed - (marker_end - marker_start) + text_before_len
        # 更簡化：clean_start = last_match_end - cumulative_removed
        clean_start = last_match_end - cumulative_removed

        result.append([page_num, clean_start, -1])  # end 稍後更新

        # 更新累計移除字元數
        cumulative_removed += marker_end - marker_start
        last_match_end = marker_end

    # 更新每頁的 end 位置
    for i in range(len(result) - 1):
        result[i][2] = result[i + 1][1]

    # 處理最後一頁的 end
    if result:
        # 清理後文本的總長度
        clean_content_len = len(content) - cumulative_removed
        result[-1][2] = clean_content_len

    # 轉換為 tuple 並返回
    if result:
        return [(p, s, e) for p, s, e in result]

    # 如果沒有任何頁碼標記，返回單一頁面覆蓋全部
    clean_content = re.sub(r'\[Page \d+\]\n?', '', content)
    return [(1, 0, len(clean_content))]


def _get_page_numbers_for_range(
    start: int,
    end: int,
    page_positions: List[tuple]
) -> List[int]:
    """
    根據字元範圍取得對應的頁碼列表

    Args:
        start: 起始位置
        end: 結束位置
        page_positions: 頁碼位置索引

    Returns:
        List[int]: 涵蓋的頁碼列表
    """
    pages: Set[int] = set()

    for page_num, page_start, page_end in page_positions:
        # 檢查範圍是否有交集
        if start < page_end and end > page_start:
            pages.add(page_num)

    return sorted(pages) if pages else [1]  # 預設為第一頁


def _split_with_overlap(
    content: str,
    config: ChunkingConfig,
    page_positions: List[tuple]
) -> List[Chunk]:
    """
    使用重疊方式切分文本，在句子邊界切分

    Args:
        content: 完整文本
        config: 切分配置
        page_positions: 頁碼位置索引（基於原始文本，此參數已不再使用）

    Returns:
        List[Chunk]: 切分結果
    """
    # 移除頁碼標記以便處理
    clean_content = re.sub(r'\[Page \d+\]\n?', '', content)

    if not clean_content.strip():
        return []

    # 建立清理後文本的頁碼位置索引
    clean_page_positions = _build_clean_page_positions(content)

    chunks = []
    current_pos = 0
    chunk_index = 0

    while current_pos < len(clean_content):
        # 計算 chunk 結束位置
        end_pos = min(current_pos + config.chunk_size, len(clean_content))

        # 如果不是最後一個 chunk，嘗試在句子邊界切分
        if end_pos < len(clean_content):
            end_pos = _find_sentence_boundary(
                clean_content,
                current_pos,
                end_pos,
                config.min_chunk_size
            )

        # 提取 chunk 內容
        chunk_content = clean_content[current_pos:end_pos].strip()

        # 跳過過小的 chunks（除非是最後一個）
        if len(chunk_content) < config.min_chunk_size and current_pos + config.chunk_size < len(clean_content):
            current_pos = end_pos
            continue

        if chunk_content:
            # 直接使用位置計算頁碼（不再需要文本搜尋）
            page_numbers = _get_page_numbers_for_range(
                current_pos,
                end_pos,
                clean_page_positions
            )

            chunk = Chunk(
                index=chunk_index,
                content=chunk_content,
                char_start=current_pos,
                char_end=end_pos,
                page_numbers=page_numbers
            )
            chunks.append(chunk)
            chunk_index += 1

        # 移動到下一個位置（考慮重疊）
        if end_pos >= len(clean_content):
            break

        current_pos = end_pos - config.chunk_overlap
        if current_pos <= chunks[-1].char_start if chunks else 0:
            current_pos = end_pos  # 避免無限循環

    return chunks


def _find_sentence_boundary(
    text: str,
    start: int,
    end: int,
    min_size: int
) -> int:
    """
    在給定範圍內尋找最佳的句子邊界

    優先順序：句號 > 分號 > 逗號 > 空格

    Args:
        text: 完整文本
        start: 搜尋起始位置
        end: 搜尋結束位置
        min_size: 最小 chunk 大小

    Returns:
        int: 最佳切分位置
    """
    # 句子結束標點（優先級由高到低）
    delimiters = ['。', '！', '？', '.', '!', '?', '；', ';', '，', ',', '\n']

    search_start = max(start + min_size, end - 100)  # 在結尾附近搜尋

    for delimiter in delimiters:
        # 從後往前搜尋分隔符
        pos = text.rfind(delimiter, search_start, end)
        if pos > start + min_size:
            return pos + 1  # 包含分隔符

    # 找不到合適的邊界，嘗試在空格處切分
    pos = text.rfind(' ', search_start, end)
    if pos > start + min_size:
        return pos + 1

    # 都找不到，使用原始結束位置
    return end
