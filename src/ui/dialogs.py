from __future__ import annotations
from datetime import date, time
from typing import Sequence
from ..domain.models import Employee, Shift
from ..services.formatting import format_full_date_label
from .widgets import CardFrame, ColorSwatch, WeekdaySelector
from PyQt6.QtCore import QTime, Qt
from PyQt6.QtGui import QColor
from PyQt6.QtWidgets import (
    QColorDialog,
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QDoubleSpinBox,
    QFormLayout,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QTimeEdit,
    QVBoxLayout,
    QWidget,
)


class EmployeeDialog(QDialog):
    def __init__(
        self, employee: Employee | None = None, parent: QWidget | None = None
    ) -> None:
        super().__init__(parent)
        self.setWindowTitle("Add person" if employee is None else "Edit person")
        self.setMinimumWidth(500)

        outer: QVBoxLayout = QVBoxLayout(self)
        outer.setContentsMargins(18, 18, 18, 18)
        outer.setSpacing(14)

        card: CardFrame = CardFrame(self, "dialogCard")
        card_layout: QVBoxLayout = QVBoxLayout(card)
        card_layout.setContentsMargins(18, 18, 18, 18)
        card_layout.setSpacing(14)

        title: QLabel = QLabel(
            "Add person" if employee is None else "Edit person", self
        )
        title.setObjectName("panelTitle")
        subtitle: QLabel = QLabel(
            "Define the person, their target hours, working days, and color.",
            self,
        )
        subtitle.setObjectName("panelSubtitle")
        subtitle.setWordWrap(True)

        form: QFormLayout = QFormLayout()
        form.setLabelAlignment(Qt.AlignmentFlag.AlignLeft)
        form.setFormAlignment(Qt.AlignmentFlag.AlignTop)
        form.setVerticalSpacing(12)
        form.setHorizontalSpacing(14)

        self._first_name: QLineEdit = QLineEdit(self)
        self._last_name: QLineEdit = QLineEdit(self)
        self._weekly_target: QDoubleSpinBox = QDoubleSpinBox(self)
        self._weekly_target.setRange(0.0, 200.0)
        self._weekly_target.setDecimals(2)
        self._weekly_target.setSingleStep(0.5)
        self._weekly_target.setSuffix(" h")

        self._weekday_selector: WeekdaySelector = WeekdaySelector(self)
        self._weekday_selector.selection_changed.connect(self._on_selection_changed)

        self._color_hex: str = "#2563eb"
        color_row: QHBoxLayout = QHBoxLayout()
        color_row.setSpacing(10)
        self._color_swatch: ColorSwatch = ColorSwatch(14, self)
        self._color_label: QLabel = QLabel(self._color_hex, self)
        self._color_label.setObjectName("rowMeta")
        self._color_button: QPushButton = QPushButton("Choose color", self)
        self._color_button.clicked.connect(lambda _=False: self._choose_color())
        color_row.addWidget(self._color_swatch)
        color_row.addWidget(self._color_label)
        color_row.addStretch(1)
        color_row.addWidget(self._color_button)
        color_widget: QWidget = QWidget(self)
        color_widget.setLayout(color_row)

        form.addRow("First name", self._first_name)
        form.addRow("Last name", self._last_name)
        form.addRow("Weekly target", self._weekly_target)
        form.addRow("Working days", self._weekday_selector)
        form.addRow("Color", color_widget)

        button_box: QDialogButtonBox = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Cancel | QDialogButtonBox.StandardButton.Ok,
            parent=self,
        )
        button_box.button(QDialogButtonBox.StandardButton.Ok).setText("Save")
        button_box.button(QDialogButtonBox.StandardButton.Ok).setObjectName(
            "primaryButton"
        )
        button_box.button(QDialogButtonBox.StandardButton.Cancel).setObjectName(
            "secondaryButton"
        )
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)

        card_layout.addWidget(title)
        card_layout.addWidget(subtitle)
        card_layout.addLayout(form)
        card_layout.addWidget(button_box)
        outer.addWidget(card)

        if employee is not None:
            self.set_employee(employee)
        else:
            self._weekday_selector.set_selected_days((0, 1, 2, 3, 4))

    def set_employee(self, employee: Employee) -> None:
        self._first_name.setText(employee.first_name)
        self._last_name.setText(employee.last_name)
        self._weekly_target.setValue(employee.weekly_target_hours)
        self._weekday_selector.set_selected_days(employee.workdays)
        self._set_color(employee.color_hex)

    def _set_color(self, color_hex: str) -> None:
        self._color_hex: str = color_hex.lower()
        self._color_swatch.set_color(self._color_hex)
        self._color_label.setText(self._color_hex)

    def _choose_color(self) -> None:
        current: QColor = QColor(self._color_hex)
        color: QColorDialog = QColorDialog.getColor(
            current, self, "Choose employee color"
        )
        if color.isValid():
            self._set_color(color.name())

    def _on_selection_changed(self) -> None:
        # No-op for now; the button state is validated on save.
        pass

    def get_values(self) -> dict[str, object]:
        return {
            "first_name": self._first_name.text(),
            "last_name": self._last_name.text(),
            "weekly_target_hours": float(self._weekly_target.value()),
            "workdays": self._weekday_selector.selected_days(),
            "color_hex": self._color_hex,
        }

    def accept(self) -> None:
        if not self._first_name.text().strip():
            QMessageBox.warning(self, "Missing data", "First name is required.")
            return
        if not self._last_name.text().strip():
            QMessageBox.warning(self, "Missing data", "Last name is required.")
            return
        if not self._weekday_selector.selected_days():
            QMessageBox.warning(self, "Missing data", "Select at least one workday.")
            return
        super().accept()


class ShiftDialog(QDialog):
    def __init__(
        self,
        selected_day: date,
        employees: Sequence[Employee],
        shift: Shift | None = None,
        parent: QWidget | None = None,
    ) -> None:
        super().__init__(parent)
        self._shift_date: date = shift.shift_date if shift is not None else selected_day
        self.setWindowTitle("Add shift" if shift is None else "Edit shift")
        self.setMinimumWidth(470)

        outer: QVBoxLayout = QVBoxLayout(self)
        outer.setContentsMargins(18, 18, 18, 18)
        outer.setSpacing(14)

        card: CardFrame = CardFrame(self, "dialogCard")
        card_layout: QVBoxLayout = QVBoxLayout(card)
        card_layout.setContentsMargins(18, 18, 18, 18)
        card_layout.setSpacing(14)

        title: QLabel = QLabel("Add shift" if shift is None else "Edit shift", self)
        title.setObjectName("panelTitle")
        subtitle: QLabel = QLabel(
            f"Selected day: {format_full_date_label(self._shift_date)}",
            self,
        )
        subtitle.setObjectName("panelSubtitle")
        subtitle.setWordWrap(True)

        form: QFormLayout = QFormLayout()
        form.setLabelAlignment(Qt.AlignmentFlag.AlignLeft)
        form.setFormAlignment(Qt.AlignmentFlag.AlignTop)
        form.setVerticalSpacing(12)
        form.setHorizontalSpacing(14)

        self._employee_combo: QComboBox = QComboBox(self)
        self._employee_combo.setMinimumWidth(220)
        for employee in employees:
            self._employee_combo.addItem(employee.full_name, employee.id)

        self._start_time: QTimeEdit = QTimeEdit(self)
        self._start_time.setDisplayFormat("HH:mm")
        self._start_time.setTime(QTime(9, 0))

        self._end_time: QTimeEdit = QTimeEdit(self)
        self._end_time.setDisplayFormat("HH:mm")
        self._end_time.setTime(QTime(17, 0))

        form.addRow("Employee", self._employee_combo)
        form.addRow("Start time", self._start_time)
        form.addRow("End time", self._end_time)

        button_box: QDialogButtonBox = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Cancel | QDialogButtonBox.StandardButton.Ok,
            parent=self,
        )
        button_box.button(QDialogButtonBox.StandardButton.Ok).setText("Save")
        button_box.button(QDialogButtonBox.StandardButton.Ok).setObjectName(
            "primaryButton"
        )
        button_box.button(QDialogButtonBox.StandardButton.Cancel).setObjectName(
            "secondaryButton"
        )
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)

        card_layout.addWidget(title)
        card_layout.addWidget(subtitle)
        card_layout.addLayout(form)
        card_layout.addWidget(button_box)
        outer.addWidget(card)

        if shift is not None:
            self.set_shift(shift, employees)

        self._employee_combo.setEnabled(bool(employees))

    def set_shift(self, shift: Shift) -> None:
        self._shift_date: date = shift.shift_date
        self._find_and_select_employee(shift.employee_id)
        self._start_time.setTime(QTime(shift.start_time.hour, shift.start_time.minute))
        self._end_time.setTime(QTime(shift.end_time.hour, shift.end_time.minute))
