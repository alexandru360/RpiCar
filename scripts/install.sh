#!/bin/bash

# Check if a folder name was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <folder_name>"
    exit 1
fi

FOLDER_NAME="$1"
INSTALL_DIR="/home/pi/Documents/$FOLDER_NAME"
SERVICE_NAME="rpi_car.service"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME"

# Check if the specified folder exists
if [ ! -d "$INSTALL_DIR" ]; then
    echo "Error: Folder $INSTALL_DIR does not exist!"
    exit 1
fi

# Create the systemd service file
echo "Creating systemd service: $SERVICE_NAME"

sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=RpiCar Motor Control Service
After=network.target

[Service]
ExecStart=$INSTALL_DIR/run_car.sh
WorkingDirectory=$INSTALL_DIR
StandardOutput=journal
StandardError=journal
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd to recognize the new service
echo "Reloading systemd..."
sudo systemctl daemon-reload

# Enable and start the service
echo "Enabling and starting $SERVICE_NAME..."
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Show the status of the service
echo "Checking service status..."
sudo systemctl status $SERVICE_NAME --no-pager

echo "Installation complete!"
