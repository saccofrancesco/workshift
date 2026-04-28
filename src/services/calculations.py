from __future__ import annotations
from calendar import monthrange
from collections.abc import Iterable
from datetime import date, datetime
from ..domain.models import Employee, Schedule, Shift
from .view_models import EmployeeListItemVM, EmployeeWorkloadVM, ShiftRowVM


def month_start(value: date) -> date:
    return value.replace(day=1)


def add_months(value: date, delta: int) -> date:
    month_index: int = value.month - 1 + delta
    year: int = value.year + month_index // 12
    month: int = month_index % 12 + 1
    last_day: tuple[int, int] = monthrange(year, month)[1]
    day: int = min(value.day, last_day)
    return date(year, month, day)


def month_day_count(value: date) -> int:
    return monthrange(value.year, value.month)[1]


def employee_display_rows(schedule: Schedule) -> list[EmployeeListItemVM]:
    return [
        EmployeeListItemVM(
            id=employee.id,
            full_name=employee.full_name,
            color_hex=employee.color_hex,
            weekly_target_hours=employee.weekly_target_hours,
            workdays=employee.workdays,
        )
        for employee in schedule.employees
    ]
