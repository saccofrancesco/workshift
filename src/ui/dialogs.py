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

        self._color_hex: str = "#2563eb"
        color_row: QHBoxLayout = QHBoxLayout()
        color_row.setSpacing(10)
        self._color_swatch: ColorSwatch = ColorSwatch(14, self)
        self._color_label: QLabel = QLabel(self._color_hex, self)
        self._color_label.setObjectName("rowMeta")
        self._color_button: QPushButton = QPushButton("Choose color", self)
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
