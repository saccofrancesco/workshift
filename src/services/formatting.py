from __future__ import annotations
from datetime import date, time


def format_month_label(value: date) -> str:
    return value.strftime("%B %Y")


def format_date_label(value: date) -> str:
    return f"{value.day} {value:%b %Y}"


def format_full_date_label(value: date) -> str:
    return f"{value:%A}, {value.day} {value:%b %Y}"


def format_time_label(value: time) -> str:
    return value.strftime("%H:%M")


def format_time_range(start: time, end: time) -> str:
    return f"{format_time_label(start)} - {format_time_label(end)}"


def format_hours(value: float, decimals: int = 2) -> str:
    text: str = f"{value:.{decimals}f}".rstrip("0").rstrip(".")
    if text == "-0":
        text = "0"
    return f"{text} h"
