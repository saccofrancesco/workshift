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
