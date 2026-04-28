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


def shift_duration_hours(shift: Shift) -> float:
    start: datetime = datetime.combine(shift.shift_date, shift.start_time)
    end: datetime = datetime.combine(shift.shift_date, shift.end_time)
    return (end - start).total_seconds() / 3600


def build_daily_shift_rows(schedule: Schedule, selected_day: date) -> list[ShiftRowVM]:
    employees_by_id: dict[str, Employee] = {
        employee.id: employee for employee in schedule.employees
    }
    rows: list[ShiftRowVM] = [
        ShiftRowVM(
            id=shift.id,
            employee_id=shift.employee_id,
            employee_name=(
                employees_by_id.get(shift.employee_id).full_name
                if employees_by_id.get(shift.employee_id)
                else "Unknown employee"
            ),
            color_hex=(
                employees_by_id.get(shift.employee_id).color_hex
                if employees_by_id.get(shift.employee_id)
                else "#94a3b8"
            ),
            start_time=shift.start_time,
            end_time=shift.end_time,
            duration_hours=shift_duration_hours(shift),
        )
        for shift in schedule.shifts
        if shift.shift_date == selected_day
    ]
    return sorted(rows, key=lambda row: (row.start_time, row.employee_name.casefold()))


def workdays_in_month(month_date: date, workdays: Iterable[int]) -> int:
    allowed: set[int] = set(workdays)
    total_days: int = month_day_count(month_date)
    count: int = 0
    for day_number in range(1, total_days + 1):
        current: date = month_date.replace(day=day_number)
        if current.weekday() in allowed:
            count += 1
    return count
