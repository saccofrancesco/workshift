from __future__ import annotations
import sys
from PyQt6.QtWidgets import QApplication
from ..ui.theme import apply_theme
from ..ui.main_window import MainWindow


def create_application(
    argv: list[str] | None = None,
) -> tuple[QApplication, MainWindow]:
    app: QApplication = QApplication(argv or sys.argv)
    app.setApplicationName("Workshift")
    app.setOrganizationName("Workshift")
    app.setOrganizationDomain("local")
    app.setStyle("Fusion")
    apply_theme(app)
    window: MainWindow = MainWindow()
    return app, window


def main(argv: list[str] | None = None) -> int:
    app, window = create_application(argv)
    window.show()
    return app.exec()
