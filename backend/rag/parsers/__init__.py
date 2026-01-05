"""
Parser 工廠模組 - 提供統一的解析器選擇介面

功能說明：
    - 提供工廠函數 get_parser() 選擇適當的 PDF 解析器
    - 定義標準化的解析結果格式 ParseResult

擴展計劃：
    - Phase 1 (目前): 僅支援 PyMuPDF（純文字擷取）
    - Phase 3 (未來): 新增 Azure Document Intelligence、Marker 等進階解析器
"""

from typing import Callable, TypedDict, List, Optional
from .pymupdf_parser import parse_pdf as pymupdf_parse


class PageContent(TypedDict):
    """
    單頁內容結構

    Attributes:
        page_number: 頁碼（從 1 開始）
        content: 該頁擷取的文字內容
    """
    page_number: int
    content: str


class ParseResult(TypedDict):
    """
    PDF 解析結果的標準格式

    所有解析器都必須返回此格式，確保下游處理邏輯的一致性。

    Attributes:
        content: 完整文本，包含 [Page N] 頁碼標記，供 chunking 模組使用
        pages: 按頁分割的內容列表，保留原始頁面結構
        metadata: 解析元數據（如頁數、解析器名稱、處理時間等）
        success: 解析是否成功
        error: 失敗時的錯誤訊息，成功時為 None
    """
    content: str
    pages: List[PageContent]
    metadata: dict
    success: bool
    error: Optional[str]


# 解析器函數的類型別名：接受檔案路徑，返回 ParseResult
ParserFunction = Callable[[str], ParseResult]


def get_parser(parser_type: str = "pymupdf") -> ParserFunction:
    """
    取得指定類型的 PDF 解析器

    Args:
        parser_type: 解析器類型，目前僅支援 "pymupdf"
                    階段三將新增 "azure_di" 和 "marker"

    Returns:
        解析函數

    Raises:
        ValueError: 不支援的解析器類型
    """
    if parser_type == "pymupdf":
        return pymupdf_parse
    # 階段三擴展：
    # elif parser_type == "azure_di":
    #     from .azure_parser import parse_pdf as azure_parse
    #     return azure_parse
    # elif parser_type == "marker":
    #     from .marker_parser import parse_pdf as marker_parse
    #     return marker_parse
    else:
        raise ValueError(f"不支援的解析器類型: {parser_type}")


__all__ = ["get_parser", "ParseResult", "PageContent"]
