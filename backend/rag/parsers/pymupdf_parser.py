"""
PyMuPDF PDF 解析器

使用 PyMuPDF (fitz) 提取 PDF 文本內容
"""

import os
import time
from typing import List, Optional

import fitz  # PyMuPDF


def parse_pdf(file_path: str) -> dict:
    """
    解析 PDF 檔案，提取文本內容

    Args:
        file_path: PDF 檔案路徑

    Returns:
        dict: 解析結果
            - content: 完整文本（含 [Page N] 標記）
            - pages: 按頁分割的內容列表
            - metadata: 解析元數據
            - success: 是否成功
            - error: 錯誤訊息（若失敗）
    """
    start_time = time.time()

    try:
        # 檢查檔案是否存在
        if not os.path.exists(file_path):
            return {
                "content": "",
                "pages": [],
                "metadata": {},
                "success": False,
                "error": f"檔案不存在: {file_path}"
            }

        # 取得檔案大小
        file_size = os.path.getsize(file_path)

        # 開啟 PDF
        doc = fitz.open(file_path)

        pages: List[dict] = []
        full_content_parts: List[str] = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            # 提取文本，保留佈局
            text = page.get_text("text")

            # 清理文本：移除多餘空白但保留段落結構
            text = _clean_text(text)

            page_data = {
                "page_number": page_num + 1,  # 1-indexed
                "content": text
            }
            pages.append(page_data)

            # 加入頁碼標記到完整文本
            if text.strip():
                full_content_parts.append(f"[Page {page_num + 1}]\n{text}")

        doc.close()

        # 組合完整文本
        full_content = "\n\n".join(full_content_parts)

        # 計算處理時間
        parse_time = time.time() - start_time

        return {
            "content": full_content,
            "pages": pages,
            "metadata": {
                "page_count": len(pages),
                "file_size": file_size,
                "parse_time_seconds": round(parse_time, 3),
                "parser": "pymupdf",
                "file_path": file_path
            },
            "success": True,
            "error": None
        }

    except fitz.FileDataError as e:
        return {
            "content": "",
            "pages": [],
            "metadata": {},
            "success": False,
            "error": f"PDF 檔案損壞或格式錯誤: {str(e)}"
        }
    except Exception as e:
        return {
            "content": "",
            "pages": [],
            "metadata": {},
            "success": False,
            "error": f"解析 PDF 時發生錯誤: {str(e)}"
        }


def _clean_text(text: str) -> str:
    """
    清理提取的文本

    - 移除連續空白行（保留單一空行作為段落分隔）
    - 移除行首行尾空白
    - 保留基本段落結構
    """
    if not text:
        return ""

    lines = text.split('\n')
    cleaned_lines: List[str] = []
    prev_empty = False

    for line in lines:
        stripped = line.strip()

        if not stripped:
            # 空行：只保留一個作為段落分隔
            if not prev_empty and cleaned_lines:
                cleaned_lines.append("")
                prev_empty = True
        else:
            cleaned_lines.append(stripped)
            prev_empty = False

    return '\n'.join(cleaned_lines)


def extract_page_text(file_path: str, page_number: int) -> Optional[str]:
    """
    提取單一頁面的文本

    Args:
        file_path: PDF 檔案路徑
        page_number: 頁碼（1-indexed）

    Returns:
        str: 頁面文本，若失敗則返回 None
    """
    try:
        doc = fitz.open(file_path)
        if page_number < 1 or page_number > len(doc):
            doc.close()
            return None

        page = doc[page_number - 1]
        text = page.get_text("text")
        doc.close()

        return _clean_text(text)
    except Exception:
        return None
