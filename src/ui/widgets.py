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


def make_empty_label(text: str) -> QLabel:
    label: QLabel = QLabel(text)
    label.setObjectName("emptyState")
    label.setAlignment(Qt.AlignmentFlag.AlignCenter)
    label.setWordWrap(True)
    return label


class CardFrame(QFrame):
    def __init__(
        self, parent: QWidget | None = None, object_name: str = "cardFrame"
    ) -> None:
        super().__init__(parent)
        self.setObjectName(object_name)


class ColorSwatch(QFrame):
    def __init__(self, size: int = 12, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._size = size
        self.setFixedSize(size, size)
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents, True)
        self.setColor("#2563eb")
