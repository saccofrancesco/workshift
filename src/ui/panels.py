from __future__ import annotations
from collections.abc import Sequence
from datetime import date
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtWidgets import (
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)
from ..services.formatting import (
    format_full_date_label,
    format_month_label,
    weekday_abbrev,
)
from ..services.view_models import (
    CalendarDayVM,
    EmployeeListItemVM,
    EmployeeWorkloadVM,
    ShiftRowVM,
)
from .widgets import (
    CalendarDayWidget,
    CardFrame,
    EmployeeRowWidget,
    ShiftRowWidget,
    WorkloadCard,
    clear_layout,
    make_empty_label,
)


class EmployeePanel(CardFrame):
    add_requested: pyqtSignal = pyqtSignal()
    edit_requested: pyqtSignal = pyqtSignal(str)
    delete_requested: pyqtSignal = pyqtSignal(str)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent, "panelFrame")
        self.row_widgets: list[EmployeeRowWidget] = list()

        outer: QVBoxLayout = QVBoxLayout(self)
        outer.setContentsMargins(12, 12, 12, 12)
        outer.setSpacing(8)

        header: QHBoxLayout = QHBoxLayout()
        header.setSpacing(8)
        title_box: QVBoxLayout = QVBoxLayout()
        title_box.setSpacing(1)
        title: QLabel = QLabel("Employees", self)
        title.setObjectName("panelTitle")
        subtitle: QLabel = QLabel("People, colors, and weekly targets", self)
        subtitle.setObjectName("panelSubtitle")
        title_box.addWidget(title)
        title_box.addWidget(subtitle)
        header.addLayout(title_box, 1)

        self._add_button: QPushButton = QPushButton("Add person", self)
        self._add_button.setObjectName("primaryButton")
        self._add_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self._add_button.clicked.connect(lambda _=False: self.add_requested.emit())
        header.addWidget(self._add_button)

        self._scroll: QScrollArea = QScrollArea(self)
        self._scroll.setWidgetResizable(True)
        self._scroll.setFrameShape(QFrame.Shape.NoFrame)

        self._content: QWidget = QWidget(self)
        self._content_layout: QVBoxLayout = QVBoxLayout(self._content)
        self._content_layout.setContentsMargins(0, 0, 0, 0)
        self._content_layout.setSpacing(10)
        self._content_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self._scroll.setWidget(self._content)

        outer.addLayout(header)
        outer.addWidget(self._scroll, 1)

        self.setMinimumWidth(280)
