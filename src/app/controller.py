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

    @property
    def schedule(self) -> Schedule:
        return self.state.scheudle

    @property
    def view_state(self) -> ViewState:
        return self.state.view_state

    @property
    def selected_day(self) -> date:
        return self.view_state.selected_day

    @property
    def selected_month(self) -> date:
        return self.view_state.selected_month

    def month_label(self) -> str:
        return format_month_label(self.selected_month)

    def employee_rows(self):
        return employee_display_rows(self.schedule)

    def calendar_grid(self):
        return build_calendar_grid(
            self.schedule, self.selected_month, self.selected_day
        )

    def daily_shift_rows(self):
        return build_daily_shift_rows(self.schedule, self.selected_day)

    def workload_rows(self):
        return build_employee_workloads(self.schedule, self.selected_month)

    def count_employee_shifts(self, employee_id: str) -> int:
        return sum(
            1 for shift in self.schedule.shifts if shift.employee_id == employee_id
        )

    def get_employee(self, employee_id: str) -> Employee:
        return require_employee(self.schedule, employee_id)

    def get_shift(self, shift_id: str) -> Shift:
        return require_shift(self.schedule, shift_id)
