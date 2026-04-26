# Importing PyQt6 libraries to define the window structure and child components
from PyQt6.QtWidgets import QMainWindow, QLabel
from PyQt6.QtCore import Qt


# Creating the main windowclass inheriting from the one in PyQt6
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        # Setting the title
        self.setWindowTitle("Workshift")

        # Creating and placing a temporarly label to show the app is running correctly
        label: QLabel = QLabel("Workshift is running")
        label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.setCentralWidget(label)
