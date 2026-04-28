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

    def set_employees(self, employees: Sequence[EmployeeListItemVM]) -> None:
        clear_layout(self._content_layout)
        self.row_widgets = list()
        if not employees:
            self._content_layout.addWidget(
                make_empty_label(
                    "No employees yet. Add a person to start planning shifts"
                )
            )
            self._content_layout.addStretch(1)
            return
        for employee in employees:
            row: EmployeeRowWidget = EmployeeRowWidget(employee, self._content)
            row.edit_requested.connect(self.edit_requested.emit)
            row.delete_requested.connect(self.delete_requested.emit)
            self._content_layout.addWidget(row)
            self.row_widgets.append(row)
        self._content_layout.addStretch(1)


class CalendarPanel(CardFrame):
    day_selected: pyqtSignal = pyqtSignal(object)
    previous_month_requested: pyqtSignal = pyqtSignal()
    next_month_requested: pyqtSignal = pyqtSignal()
    today_requested: pyqtSignal = pyqtSignal()

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent, "panelFrame")
        self.day_cells: list[CalendarDayWidget] = list()

        outer: QVBoxLayout = QVBoxLayout(self)
        outer.setContentsMargins(12, 12, 12, 12)
        outer.setSpacing(8)

        title: QLabel = QLabel("Monthly calendar", self)
        title.setObjectName("panelTitle")
        outer.addWidget(title)

        nav_row: QHBoxLayout = QHBoxLayout()
        nav_row.setSpacing(6)
        self._prev_button: QPushButton = QPushButton("Prev", self)
        self._prev_button.clicked.connect(self.previous_month_requested.emit)
        self._month_label: QLabel = QLabel(format_month_label(date.today()), self)
        self._month_label.setObjectName("panelSubtitle")
        self._month_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._next_button: QPushButton = QPushButton("Next", self)
        self._next_button.clicked.connect(self.next_month_requested.emit)
        self._today_button: QPushButton = QPushButton("Today", self)
        self._today_button.clicked.connect(self.today_requested.emit)
        nav_row.addWidget(self._prev_button)
        nav_row.addWidget(self._month_label, 1)
        nav_row.addWidget(self._today_button)
        nav_row.addWidget(self._next_button)
        outer.addLayout(nav_row)

        weekday_row: QHBoxLayout = QHBoxLayout()
        weekday_row.setSpacing(4)
        for index in range(7):
            label: QLabel = QLabel(weekday_abbrev(index), self)
            label.setObjectName("panelSubtitle")
            label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            label.setMinimumHeight(16)
            weekday_row.addWidget(label)
        outer.addLayout(weekday_row)

        self._grid: QGridLayout = QGridLayout()
        self._grid.setSpacing(4)
        for row in range(6):
            for column in range(7):
                cell: CalendarDayWidget = CalendarDayWidget(self)
                cell.clicked.connect(
                    lambda day, signal=self.day_selected: signal.emit(day)
                )
                self._grid.addWidget(cell, row, column)
                self.day_cells.append(cell)
        outer.addLayout(self._grid, 1)

        self.setMinimumWidth(380)

    def set_month(self, month_date: date, grid: Sequence[CalendarDayVM]) -> None:
        self._month_label.setText(format_month_label(month_date))
        flattened: list[CalendarDayVM] = [day for row in grid for day in row]
        for cell, vm in zip(self.day_cells, flattened):
            cell.set_day(vm)


class ShiftPanel(CardFrame):
    add_requested: pyqtSignal = pyqtSignal()
    edit_requested: pyqtSignal = pyqtSignal(str)
    delete_requested: pyqtSignal = pyqtSignal(str)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent, "panelFrame")
        self.row_widgets: list[ShiftRowWidget] = list()

        outer: QVBoxLayout = QVBoxLayout(self)
        outer.setContentsMargins(12, 12, 12, 12)
        outer.setSpacing(10)

        header: QHBoxLayout = QHBoxLayout()
        header.setSpacing(8)
        title_box: QVBoxLayout = QVBoxLayout()
        title_box.setSpacing(1)
        title: QLabel = QLabel("Daily shifts", self)
        title.setObjectName("panelTitle")
        subtitle: QLabel = QLabel("Sorted by start time", self)
        subtitle.setObjectName("panelSubtitle")
        title_box.addWidget(title)
        title_box.addWidget(subtitle)
        header.addLayout(title_box, 1)

        self._add_button: QPushButton = QPushButton("Add shift", self)
        self._add_button.setObjectName("primaryButton")
        self._add_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self._add_button.clicked.connect(lambda _=False: self.add_requested.emit())
        header.addWidget(self._add_button)

        self._selected_day_label: QLabel = QLabel(
            format_full_date_label(date.today()), self
        )
        self._selected_day_label.setObjectName("panelSubtitle")

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
        outer.addWidget(self._selected_day_label)
        outer.addWidget(self._scroll, 1)

        self.setMinimumWidth(300)

    def set_selected_day(self, selected_day: date) -> None:
        self._selected_day_label.setText(format_full_date_label(selected_day))
