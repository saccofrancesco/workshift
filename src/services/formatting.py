from __future__ import annotations
from datetime import date, time


def format_month_label(value: date) -> str:
    return value.strftime("%B %Y")
