from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date
from ..domain.models import Schedule


@dataclass(slots=True)
class ViewState:
    selected_month: date
    selected_day: date


def create_default_view_state(today: date | None = None) -> ViewState:
    today: date | None = today or date.today()
    return ViewState(selected_month=today.replace(day=1), selected_day=today)


@dataclass(slots=True)
class SessionState:
    scheudle: Schedule = field(default_factory=Schedule)
    view_state: ViewState = field(default_factory=create_default_view_state)
