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


class EmployeeRowWidget(CardFrame):
    edit_requested: pyqtSignal[str] = pyqtSignal(str)
    delete_requested: pyqtSignal[str] = pyqtSignal(str)

    def __init__(
        self, employee: EmployeeListItemVM, parent: QWidget | None = None
    ) -> None:
        super().__init__(parent)
        self.employee_id = employee.id
        layout: QHBoxLayout = QHBoxLayout(self)
        layout.setContentsMargins(12, 10, 12, 10)
        layout.setSpacing(8)

        self._swatch: ColorSwatch = ColorSwatch(12, self)
        self._swatch.set_color(employee.color_hex)

        text_box: QVBoxLayout = QVBoxLayout()
        text_box.setSpacing(2)

        self._name_label: QLabel = QLabel(employee.full_name, self)
        self._name_label.setObjectName("rowTitle")
        self._meta_label: QLabel = QLabel(
            f"{format_hours(employee.weekly_target_hours)} / week", self
        )
        self._meta_label.setObjectName("rowMeta")

        text_box.addWidget(self._name_label)
        text_box.addWidget(self._meta_label)

        self._edit_button = QPushButton("Edit", self)
        self._edit_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self._edit_button.clicked.connect(
            lambda _=False: self.edit_requested.emit(self.employee_id)
        )
        self._delete_button = QPushButton("Delete", self)
        self._delete_button.setObjectName("dangerButton")
        self._delete_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self._delete_button.clicked.connect(
            lambda _=False: self.delete_requested.emit(self.employee_id)
        )

        layout.addWidget(self._swatch)
        layout.addLayout(text_box, 1)
        layout.addWidget(self._edit_button)
        layout.addWidget(self._delete_button)


class ShiftRowWidget(CardFrame):
    edit_requested = pyqtSignal(str)
    delete_requested = pyqtSignal(str)

    def __init__(self, shift: ShiftRowVM, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.shift_id: str = shift.id
        layout: QHBoxLayout = QHBoxLayout(self)
        layout.setContentsMargins(12, 10, 12, 10)
        layout.setSpacing(8)

        self._swatch: ColorSwatch = ColorSwatch(12, self)
        self._swatch.set_color(shift.color_hex)

        text_box: QVBoxLayout = QVBoxLayout(shift)
        text_box.setSpacing(2)
        self._name_label: QLabel = QLabel(shift.employee_name, self)
        self._name_label.setObjectName("rowTitle")
        self._time_label: QLabel = QLabel(
            format_time_range(shift.start_time, shift.end_time), self
        )
        self._time_label.setObjectName("rowMeta")
        text_box.addWidget(self._name_label)
        text_box.addWidget(self._time_label)

        self._duration_label: QLabel = QLabel(format_hours(shift.duration_hours), self)
        self._duration_label.setObjectName("rowMeta")

        self._edit_button: QPushButton = QPushButton("Edit", self)
        self._edit_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self._edit_button.clicked.connect(
            lambda _=False: self.edit_requested.emit(self.shift_id)
        )
        self._delete_button: QPushButton = QPushButton("Delete", self)
        self._delete_button.setObjectName("dangerButton")
        self._delete_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self._delete_button.clicked.connect(
            lambda _=False: self.delete_requested.emit(self.shift_id)
        )

        layout.addWidget(self._swatch)
        layout.addWidget(text_box, 1)
        layout.addWidget(self._duration_label)
        layout.addWidget(self._edit_button)
        layout.addWidget(self._delete_button)


class WorkloadCard(CardFrame):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._vm: EmployeeWorkloadVM | None = None

        layout: QVBoxLayout = QVBoxLayout(self)
        layout.setContentsMargins(12, 10, 12, 10)
        layout.setSpacing(6)

        top_row: QHBoxLayout = QHBoxLayout()
        top_row.setSpacing(6)
        self._swatch: ColorSwatch = ColorSwatch(8, self)
        self._name_label: QLabel = QLabel(self)
        self._name_label.setObjectName("workloadTitle")
        top_row.addWidget(self._swatch)
        top_row.addWidget(self._name_label, 1)

        self._summary_label: QLabel = QLabel(self)
        self._summary_label.setObjectName("workloadMeta")

        self._progress: QProgressBar = QProgressBar(self)
        self._progress.setTextVisible(False)

        layout.addLayout(top_row)
        layout.addWidget(self._summary_label)
        layout.addWidget(self._progress)

    def set_workload(self, workload: EmployeeWorkloadVM) -> None:
        self._vm: EmployeeWorkloadVM = workload
        self._swatch.set_color(workload.color_hex)
        self._name_label.setText(workload.full_name)
        self._summary_label.setText(
            " · ".join(
                (
                    f"{format_hours(workload.assigned_hours)} assigned",
                    f"{format_hours(workload.target_hours)} target",
                    f"{format_hours(workload.remaining_hours)} remaining",
                )
            )
        )
        self._progress.setValue(int(round(workload.progress_ratio * 100)))
