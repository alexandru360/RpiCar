#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if Python 3 is installed
if ! command -v python3 &>/dev/null; then
    echo "Python 3 is not installed! Installing..."
    sudo apt update && sudo apt install -y python3 python3-venv python3-pip || { echo "Failed to install Python 3!"; exit 1; }
fi

# Check if virtual environment exists, create if not
if [ ! -d "env" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv env || { echo "Failed to create virtual environment!"; exit 1; }
fi

# Activate the virtual environment
source env/bin/activate || { echo "Failed to activate virtual environment!"; exit 1; }

# Upgrade pip
echo "Upgrading pip..."
python3 -m pip install --upgrade pip || { echo "Failed to upgrade pip!"; exit 1; }

# List of required Python packages
REQUIRED_PACKAGES=(
    "flask"
    "RPi.GPIO"
    "pigpio"
    "opencv-python"
    "numpy"
    "requests"
    "flask-cors"
)

# Install missing Python packages
for PACKAGE in "${REQUIRED_PACKAGES[@]}"; do
    python3 -m pip show "$PACKAGE" > /dev/null 2>&1 || {
        echo "Installing missing package: $PACKAGE"
        python3 -m pip install --upgrade "$PACKAGE" || { echo "Failed to install $PACKAGE!"; exit 1; }
    }
done

# Ensure pigpiod daemon is running
if ! pgrep -x "pigpiod" > /dev/null; then
    echo "Starting pigpiod service..."
    sudo systemctl start pigpiod || { echo "Failed to start pigpiod!"; exit 1; }
fi

# Run the Python application
echo "Starting run_car.py..."
exec python3 run_car.py
