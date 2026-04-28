from __future__ import annotations
from datetime import date, timedelta
from ..domain.models import Employee, Schedule, Shift
from .calculations import month_start
from .formatting import format_full_date_label, format_time_range
from .view_models import CalendarDayVM


def build_day_tooltip(schedule: Schedule, day: date) -> str:
    employees_by_id: dict[str, Employee] = {
        employee.id: employee for employee in schedule.employees
    }
    shifts: list[Shift] = sorted(
        [shift for shift in schedule.shifts if shift.shift_date == day],
        key=lambda shift: (
            shift.start_time,
            (
                employees_by_id.get(shift.employee_id).full_name.casefold()
                if employees_by_id.get(shift.employee_id)
                else "unknown"
            ),
        ),
    )
    if not shifts:
        return f"{format_full_date_label(day)}\nNo shifts planned."
    lines: list[str] = [format_full_date_label(day)]
    for shift in shifts:
        employee: Employee = employees_by_id.get(shift.employee_id)
        name: str = employee.full_name if employee else "Unknown employee"
        lines.append(f"{format_time_range(shift.start_time, shift.end_time)}  {name}")
    return "\n".join(lines)
