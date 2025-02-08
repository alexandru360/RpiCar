#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")"

# Activate the virtual environment
if [ ! -d "env" ]; then
    echo "Virtual environment not found. Creating a new one..."
    python3 -m venv env || { echo "Failed to create virtual environment!"; exit 1; }
fi

source env/bin/activate || { echo "Failed to activate virtual environment!"; exit 1; }

# Ensure required Python packages are installed
REQUIRED_PACKAGES=("flask" "RPi.GPIO" "pigpio")

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
