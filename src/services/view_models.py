from __future__ import annotations
from dataclasses import dataclass
from datetime import date, time


@dataclass(frozen=True, slots=True)
class EmployeeListItemVM:
    id: str
    full_name: str
    color_hex: str
    weekly_target_hours: float
    workdays: tuple[int, ...]


@dataclass(frozen=True, slots=True)
class ShiftRowVM:
    id: str
    employee_id: str
    employee_name: str
    color_hex: str
    start_time: time
    end_time: time
    duration_hours: float
