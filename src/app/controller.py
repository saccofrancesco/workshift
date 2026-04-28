from __future__ import annotations
from datetime import date, time
from PyQt6.QtCore import QObject, pyqtSignal
from ..domain.models import Employee, Schedule, Shift
from ..services.calculations import (
    add_months,
    build_daily_shift_rows,
    build_employee_workloads,
    employee_display_rows,
)
from ..services.calendar import build_calendar_grid
from ..services.export import export_schedule_xlsx
from ..services.formatting import format_month_label
from ..services.validation import (
    WorkshiftError,
    require_employee,
    require_shift,
    validate_employee_fields,
    validate_shift_fields,
)
from .state import SessionState, ViewState, create_default_view_state


def _normalize_color_hex(color_hex: str) -> str:
    value: str = color_hex.strip()
    if not value.startswith("#"):
        value: str = f"#{value}"
    if len(value) != 7:
        raise WorkshiftError("Color must be a hex value like #2563eb.")
    return value.lower()


class WorkshiftController(QObject):
    changed: pyqtSignal = pyqtSignal()

    def __init__(
        self, schedule: Schedule | None = None, today: date | None = None
    ) -> None:
        super().__init__()
        self.state: SessionState = SessionState(
            schedule=schedule or Schedule(),
            view_state=create_default_view_state(today),
        )
