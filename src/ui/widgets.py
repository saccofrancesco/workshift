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

    def set_color(self, color_hex: str) -> None:
        self.setStyleSheet(
            f"background: {color_hex}; border-radius: {max(self._size // 2, 1)}px"
        )


class WeekdaySelector(QWidget):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        layout: QHBoxLayout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)
        self._buttons: list[QToolButton] = list()
        for index in range(7):
            button: QToolButton = QToolButton(self)
            button.setCheckable(True)
            button.setObjectName("workdayButton")
            button.setText(weekday_abbrev(index))
            button.setCursor(Qt.CursorShape.PointingHandCursor)
            button.toggled.connect(self._emit_change)
            layout.addWidget(button)
            self._buttons.append(button)
        self.set_selected_days((0, 1, 2, 3, 4))

    def _emit_change(self) -> None:
        self.selection_changed.emit()

    selection_changed: pyqtSignal = pyqtSignal()

    def set_selected_days(self, days: tuple[int, ...] | list[int]) -> None:
        normalized: set[int] = set(days)
        for index, button in enumerate(self._buttons):
            button.setChecked(index in normalized)
