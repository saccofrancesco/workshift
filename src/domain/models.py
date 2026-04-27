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
