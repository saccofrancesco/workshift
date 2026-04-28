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


def monthly_target_hours(employee: Employee, month_date: date) -> float:
    if not employee.workdays:
        return 0.0
    workday_count: int = workdays_in_month(month_date, employee.workdays)
    if workday_count == 0:
        return 0.0
    configured_days: int = len(employee.workdays)
    return employee.weekly_target_hours / configured_days * workday_count


def assigned_hours_for_employee(
    schedule: Schedule, employee_id: str, month_date: date
) -> float:
    month_index: tuple[int, int] = (month_date.year, month_date.month)
    return sum(
        shift_duration_hours(shift)
        for shift in schedule.shifts
        if shift.employee_id == employee_id
        and (shift.shift_date.year, shift.shift_date.month) == month_index
    )


def build_employee_workloads(
    schedule: Schedule, month_date: date
) -> list[EmployeeWorkloadVM]:
    workloads: list[EmployeeWorkloadVM] = list()
    for employee in schedule.employees:
        assigned: float = assigned_hours_for_employee(schedule, employee.id, month_date)
        target: float = monthly_target_hours(employee, month_date)
        remaining: float = target - assigned
        if target <= 0:
            progress: float = 1.0 if assigned > 0 else 0.0
        else:
            progress: float = max(0.0, min(assigned / target, 1.0))
        workloads.append(
            EmployeeWorkloadVM(
                id=employee.id,
                full_name=employee.full_name,
                color_hex=employee.color_hex,
                assigned_hours=assigned,
                target_hours=target,
                remaining_hours=remaining,
                progress_ratio=progress,
            )
        )
    return workloads
