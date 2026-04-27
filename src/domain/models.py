from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, time
from uuid import uuid4


def _new_id() -> str:
    return uuid4().hex


@dataclass(slots=True)
class Employee:
    first_name: str
    last_name: str
    weekly_target_hours: float
    workdays: tuple[int, ...]
    color_hex: str
    id: str = field(default_factory=_new_id)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


@dataclass(slots=True)
class Shift:
    employee_id: str
    shift_date: date
    start_time: time
    end_time: time
    id: str = field(default_factory=_new_id)


@dataclass(slots=True)
class Schedule:
    employees: list[Employee] = field(default_factory=list)
    shifts: list[Shift] = field(default_factory=list)
