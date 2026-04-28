from __future__ import annotations
from datetime import date
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from ..domain.models import Schedule
from .calculations import build_employee_workloads
from .formatting import contrast_text_color, format_month_label


def _solid_fill(color_hex: str) -> PatternFill:
    return PatternFill(fill_type="solid", fgColor=color_hex.replace("#", "").upper())


def _font_color(color_hex: str) -> str:
    return f"FF{color_hex.replace('#', '').upper()}"
