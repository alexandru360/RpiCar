#!/bin/bash

# Ensure the script is run with sudo
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root. Use: sudo $0"
   exit 1
fi

# Get the current directory where the script is located
INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
# Standard service name used by this project
SERVICE_NAME="rpicar.service"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME"
NGINX_CONF="/etc/nginx/sites-available/default"

echo "Installing RpiCar from $INSTALL_DIR..."

# Function to check if a package is installed
is_installed() {
    dpkg -l | grep -qw "$1"
}

# Function to install a package if not installed
install_package() {
    if is_installed "$1"; then
        echo "$1 is already installed."
    else
        echo "Installing $1..."
        apt update && apt install -y "$1"
    fi
}

# Install required system packages
install_package python3
install_package python3-pip
install_package python3-venv
install_package nginx
install_package git

# Setup Python virtual environment
echo "Setting up Python virtual environment..."
cd "$INSTALL_DIR"
if [ ! -d "env" ]; then
    python3 -m venv env
fi
source env/bin/activate

# Install required Python packages
echo "Installing required Python packages..."
pip install --upgrade pip
pip install flask RPi.GPIO pigpio

# Ensure pigpiod daemon is running
if ! pgrep -x "pigpiod" > /dev/null; then
    echo "Starting pigpiod service..."
    systemctl start pigpiod
    systemctl enable pigpiod
fi

# Create the systemd service file
echo "Creating systemd service: $SERVICE_NAME"
tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=RpiCar Control Service
After=network.target pigpiod.service

[Service]
Type=simple
User=pi
WorkingDirectory=$INSTALL_DIR/python-api
ExecStart=$INSTALL_DIR/python-api/env/bin/python $INSTALL_DIR/python-api/run_car.py
ExecStop=/bin/bash -lc '$INSTALL_DIR/python-api/env/bin/python - <<"PY"\nimport RPi.GPIO as GPIO\ntry: GPIO.cleanup()\nexcept: pass\ntry: import pigpio; pi=pigpio.pi(); pi.stop()\nexcept: pass\nPY'
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start the service
echo "Reloading systemd..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

# Copy the HTML directory to Nginx
if [ -d "$INSTALL_DIR/html" ]; then
    echo "Copying web files to Nginx..."
    rm -rf /var/www/html/*
    cp -r "$INSTALL_DIR/html/"* /var/www/html/
else
    echo "Warning: No 'html' directory found in $INSTALL_DIR. Skipping web UI installation."
fi

# Configure Nginx as a reverse proxy for Flask
echo "Configuring Nginx..."
tee $NGINX_CONF > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;

    root /var/www/html;
    index index.html index.htm;

    server_name 19.19.19.211;

    # Prevent caching
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    add_header Pragma "no-cache";
    add_header Expires "0";

    location / {
        try_files \$uri \$uri/ =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

# Display service status
echo "Checking service status..."
systemctl status $SERVICE_NAME --no-pager

echo "Installation complete!"
