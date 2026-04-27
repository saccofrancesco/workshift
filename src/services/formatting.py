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


def contrast_text_color(color_hex: str) -> str:
    value: str = color_hex.lstrip("#")
    if len(value) != 6:
        return "#111827"
    red: int = int(value[0:2], 16)
    green: int = int(value[2:4], 16)
    blue: int = int(value[4:6], 16)
    luminance: float = 0.299 * red + 0.587 * green + 0.114 * blue
    return "#ffffff" if luminance < 140 else "#111827"


def weekday_abbrev(index: int) -> str:
    labels: tuple[str] = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    return labels[index]


def weekday_name(index: int) -> str:
    labels: tuple[str] = (
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    )
    return labels[index]
