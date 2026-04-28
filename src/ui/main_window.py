from __future__ import annotations
from PyQt6.QtWidgets import QMainWindow
from ..app.controller import WorkshiftController
from ..services.view_models import EmployeeListItemVM
from ..services.formatting import format_full_date_label, format_time_range
from ..services.validation import WorkshiftError
from .dialogs import DeleteConfirmDialog, EmployeeDialog, ShiftDialog
from .panels import CalendarPanel, EmployeePanel, ShiftPanel, WorkloadPanel
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QFileDialog,
    QDialog,
    QMainWindow,
    QMessageBox,
    QSplitter,
    QVBoxLayout,
    QWidget,
)


class MainWindow(QMainWindow):
    def __init__(
        self, controller: WorkshiftController, parent: QWidget | None = None
    ) -> None:
        super().__init__(parent)
        self.controller: WorkshiftController = controller
        self.setWindowTitle("Workshift")
        self.resize(1500, 960)
        self.setMinimumSize(1280, 700)

        central: QWidget = QWidget(self)
        layout: QVBoxLayout = QVBoxLayout(central)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(10)

        self.employee_panel: EmployeePanel = EmployeePanel(self)
        self.calendar_panel: CalendarPanel = CalendarPanel(self)
        self.shift_panel: ShiftPanel = ShiftPanel(self)
        self.workload_panel: WorkloadPanel = WorkloadPanel(self)

        self.top_splitter: QSplitter = QSplitter(Qt.Orientation.Horizontal, self)
        self.top_splitter.setChildrenCollapsible(False)
        self.top_splitter.setHandleWidth(8)
        self.top_splitter.addWidget(self.employee_panel)
        self.top_splitter.addWidget(self.calendar_panel)
        self.top_splitter.addWidget(self.shift_panel)
        self.top_splitter.setStretchFactor(0, 1)
        self.top_splitter.setStretchFactor(1, 2)
        self.top_splitter.setStretchFactor(2, 1)
        self.top_splitter.setSizes([320, 760, 320])

        self.main_splitter: QSplitter = QSplitter(Qt.Orientation.Vertical, self)
        self.main_splitter.setChildrenCollapsible(False)
        self.main_splitter.setHandleWidth(8)
        self.main_splitter.addWidget(self.top_splitter)
        self.main_splitter.addWidget(self.workload_panel)
        self.main_splitter.setStretchFactor(0, 3)
        self.main_splitter.setStretchFactor(1, 2)
        self.main_splitter.setSizes([520, 360])

        layout.addWidget(self.main_splitter, 1)
        self.setCentralWidget(central)

        self.controller.changed.connect(self.refresh)

        self.refresh()

    def refresh(self) -> None:
        employees: list[EmployeeListItemVM] = self.controller.employee_rows()
        self.employee_panel.set_employees(employees)
        self.calendar_panel.set_month(
            self.controller.selected_month, self.controller.calendar_grid()
        )
        self.shift_panel.set_selected_day(self.controller.selected_day)
        self.shift_panel.set_add_enabled(bool(employees))
        self.shift_panel.set_shifts(self.controller.daily_shift_rows())
        self.workload_panel.set_workloads(self.controller.workload_rows())
        self.setWindowTitle(f"Workshift - {self.controller.month_label()}")

    def _show_error(self, title: str, message: str) -> None:
        QMessageBox.warning(self, title, message)
