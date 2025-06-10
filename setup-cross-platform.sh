#!/bin/bash
# Ubuntu Host Setup Script for Cross-Platform Executable Runner

set -e

echo "Cross-Platform Executable Runner - Ubuntu Host Setup"
echo "===================================================="

# Configuration
INSTALL_DIR="/opt/executable-runner"
SERVICE_NAME="executable-runner"
SERVICE_USER="runner"
PORT=5000

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

echo "Creating installation directory..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/binaries"
mkdir -p "$INSTALL_DIR/logs"
mkdir -p "$INSTALL_DIR/src"

# Copy application files
echo "Copying application files..."
cp cross-platform-server.js "$INSTALL_DIR/"
cp src/cross-platform.html "$INSTALL_DIR/src/"
cp src/cross-platform.js "$INSTALL_DIR/src/"
cp src/style.css "$INSTALL_DIR/src/" 2>/dev/null || echo "style.css not found, will use basic styling"

# Copy existing executables if available
if [ -f "src-tauri/binaries/dialog-tool" ]; then
    echo "Copying Linux executable..."
    cp src-tauri/binaries/dialog-tool "$INSTALL_DIR/binaries/"
    chmod +x "$INSTALL_DIR/binaries/dialog-tool"
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install additional tools for remote execution
echo "Installing required packages..."
apt-get update
apt-get install -y openssh-client sshpass curl jq

# Create service user
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "Creating service user..."
    useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
fi

# Set permissions
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/binaries/"* 2>/dev/null || true

# Create systemd service
echo "Creating systemd service..."
cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=Cross-Platform Executable Runner
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node cross-platform-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$PORT

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# Configure firewall (if UFW is available)
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    ufw allow $PORT/tcp
fi

# Create management scripts
echo "Creating management scripts..."

# Start script
cat > "$INSTALL_DIR/start.sh" << EOF
#!/bin/bash
sudo systemctl start $SERVICE_NAME
sudo systemctl status $SERVICE_NAME
EOF

# Stop script
cat > "$INSTALL_DIR/stop.sh" << EOF
#!/bin/bash
sudo systemctl stop $SERVICE_NAME
EOF

# Status script
cat > "$INSTALL_DIR/status.sh" << EOF
#!/bin/bash
sudo systemctl status $SERVICE_NAME
echo ""
echo "Logs (last 20 lines):"
sudo journalctl -u $SERVICE_NAME -n 20
EOF

# Restart script
cat > "$INSTALL_DIR/restart.sh" << EOF
#!/bin/bash
sudo systemctl restart $SERVICE_NAME
sudo systemctl status $SERVICE_NAME
EOF

chmod +x "$INSTALL_DIR"/*.sh

# Create configuration file
cat > "$INSTALL_DIR/config.json" << EOF
{
  "server": {
    "port": $PORT,
    "host": "0.0.0.0"
  },
  "execution": {
    "defaultTimeout": 60,
    "maxConcurrentJobs": 5
  },
  "logging": {
    "level": "info",
    "file": "$INSTALL_DIR/logs/application.log"
  },
  "security": {
    "enableApiKey": false,
    "allowedHosts": ["*"]
  }
}
EOF

chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/config.json"

# Enable and start service
echo "Enabling and starting service..."
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# Wait a moment for service to start
sleep 3

echo ""
echo "===================================================="
echo "Installation Complete!"
echo "===================================================="
echo ""
echo "Service Status:"
systemctl status "$SERVICE_NAME" --no-pager -l
echo ""
echo "Installation Directory: $INSTALL_DIR"
echo "Service Name: $SERVICE_NAME"
echo "Web Interface: http://$(hostname -I | awk '{print $1}'):$PORT/cross-platform.html"
echo ""
echo "Management Commands:"
echo "  Start:   $INSTALL_DIR/start.sh"
echo "  Stop:    $INSTALL_DIR/stop.sh"
echo "  Status:  $INSTALL_DIR/status.sh"
echo "  Restart: $INSTALL_DIR/restart.sh"
echo ""
echo "Logs: sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "NEXT STEPS:"
echo "1. Deploy the Windows agent to target machines using deploy-windows.bat"
echo "2. Copy Windows executables to target machines' C:\\ExecutableRunner\\binaries\\"
echo "3. Access the web interface to configure remote execution"
echo ""

# Test the service
echo "Testing service..."
if curl -s "http://localhost:$PORT/system-info" > /dev/null; then
    echo "✓ Service is responding correctly"
else
    echo "✗ Service test failed - check logs with: sudo journalctl -u $SERVICE_NAME"
fi