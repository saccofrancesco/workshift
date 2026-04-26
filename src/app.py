# Importing libraries to configure and run the MainWindow
import sys
from PyQt6.QtWidgets import QApplication
from src.components.main_window import MainWindow


# Start the application enabling exit with cross icon at the top
def run():
    app: QApplication = QApplication(sys.argv)

    # Instantiating the window and it's size
    window: MainWindow = MainWindow()
    window.resize(800, 500)
    window.show()

    sys.exit(app.exec())
