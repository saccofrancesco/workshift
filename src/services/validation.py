from __future__ import annotations
from collections.abc import Iterable
from datetime import date, time
from ..domain.models import Employee, Schedule, Shift


class WorkshiftError(ValueError):
    """User-facing validation error."""


def normalize_workdays(workdays: Iterable[int]) -> tuple[int, ...]:
    normalized: tuple[int] = tuple(sorted({int(day) for day in workdays}))
    if not normalized:
        raise WorkshiftError("Select at least one workday.")
    invalid: list[int] = [day for day in normalized if day < 0 or day > 6]
    if invalid:
        raise WorkshiftError("Workdays must be between Monday and Sunday.")
    return normalized


def validate_employee_fields(
    first_name: str,
    last_name: str,
    weekly_target_hours: float,
    workdays: Iterable[int],
) -> tuple[str, str, float, tuple[int, ...]]:
    first_name: str = first_name.strip()
    last_name: str = last_name.strip()
    if not first_name:
        raise WorkshiftError("First name is required.")
    if not last_name:
        raise WorkshiftError("Last name is required.")
    if weekly_target_hours < 0:
        raise WorkshiftError("Weekly target hours cannot be negative.")
    normalized_workdays: tuple[int, ...] = normalize_workdays(workdays)
    return first_name, last_name, weekly_target_hours, normalized_workdays


def require_employee(schedule: Schedule, employee_id: str) -> Employee:
    for employee in schedule.employees:
        if employee.id == employee_id:
            return employee
    raise WorkshiftError("Selected employee no longer exists.")
