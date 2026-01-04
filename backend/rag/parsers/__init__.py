"""
Parser 工廠模組 - 提供統一的解析器選擇介面

階段一只支援 PyMuPDF，但保留擴展空間供階段三新增其他解析器
"""

from typing import Callable, TypedDict, List, Optional
from .pymupdf_parser import parse_pdf as pymupdf_parse


class PageContent(TypedDict):
    """單頁內容"""
    page_number: int
    content: str


class ParseResult(TypedDict):
    """解析結果標準格式"""
    content: str                    # 完整文本（包含頁碼標記）
    pages: List[PageContent]        # 按頁分割的內容
    metadata: dict                  # 解析元數據
    success: bool
    error: Optional[str]


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
