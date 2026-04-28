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


def _apply_border(cell) -> None:
    thin: Side = Side(style="thin", color="D7DCE3")
    cell.border = Border(left=thin, right=thin, top=thin, bottom=thin)


def _style_header_row(sheet, row_index: int, columns: int) -> None:
    fill: PatternFill = PatternFill(fill_type="solid", fgColor="EAF0FF")
    for column in range(1, columns + 1):
        cell = sheet.cell(row=row_index, column=column)
        cell.font = Font(bold=True, color="0F172A")
        cell.fill = fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        _apply_border(cell)


def _format_sheet_title(sheet, title: str, subtitle: str, columns: int) -> None:
    sheet.merge_cells(start_row=1, start_column=1, end_row=1, end_column=columns)
    sheet.merge_cells(start_row=2, start_column=1, end_row=2, end_column=columns)
    title_cell = sheet.cell(row=1, column=1)
    subtitle_cell = sheet.cell(row=2, column=1)
    title_cell.value = title
    subtitle_cell.value = subtitle
    title_cell.font = Font(size=15, bold=True, color="0F172A")
    subtitle_cell.font = Font(size=10, color="475569")
    title_cell.alignment = Alignment(horizontal="left")
    subtitle_cell.alignment = Alignment(horizontal="left")


def _apply_auto_filter(sheet, start_row: int, end_row: int, columns: int) -> None:
    sheet.auto_filter.ref = f"A{start_row}:{get_column_letter(columns)}{end_row}"


def _set_page_setup(sheet) -> None:
    sheet.page_setup.orientation = "landscape"
    sheet.page_setup.fitToWidth = 1
    sheet.page_setup.fitToHeight = 0
    sheet.sheet_properties.pageSetUpPr.fitToPage = True
    sheet.page_margins.left = 0.3
    sheet.page_margins.right = 0.3
    sheet.page_margins.top = 0.4
    sheet.page_margins.bottom = 0.4
    sheet.sheet_view.showGridLines = False
