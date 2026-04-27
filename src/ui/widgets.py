from __future__ import annotations
from datetime import date
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QProgressBar,
    QPushButton,
    QToolButton,
    QVBoxLayout,
    QWidget,
)
from ..services.formatting import format_hours, format_time_range, weekday_abbrev
from ..services.view_models import (
    CalendarDayVM,
    EmployeeListItemVM,
    EmployeeWorkloadVM,
    ShiftRowVM,
)


def clear_layout(layout) -> None:
    while layout.count():
        item = layout.takeAt(0)
        widget = item.widget()
        if widget is not None:
            widget.setParent(None)
            widget.deleteLater()
        child_layout = item.layout()
        if child_layout is not None:
            clear_layout(child_layout)
