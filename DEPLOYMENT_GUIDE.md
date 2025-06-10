# Client-Direct Windows Execution Deployment Guide

## Overview

This system allows browsers to execute Windows programs directly on remote Windows machines. The Ubuntu host serves the web interface while browsers communicate directly with Windows agents via HTTP/HTTPS.

## Architecture

```
[Browser] -> [Ubuntu Web Server] (serves interface)
[Browser] -> [Windows Agent] (direct execution)
```

## Quick Deployment

### Ubuntu Host Setup

1. **Start the web server**:
   ```bash
   node client-direct-server.js
   ```

2. **Access the interface**:
   - Open: `http://your-ubuntu-host:5000`

### Windows Endpoint Setup

1. **Run deployment script** (as Administrator):
   ```cmd
   deploy-windows.bat
   ```

2. **Start the agent**:
   ```cmd
   C:\ExecutableRunner\start-agent.bat
   ```

3. **Copy executables** to `C:\ExecutableRunner\binaries\`

## Web Interface Usage

### Initial Setup

1. Open the web interface in your browser
2. Test local connection to verify the Ubuntu host is working
3. Configure Windows endpoints:
   - Enter Windows host IP/hostname
   - Set agent port (default: 8080)
   - Test connection to verify Windows agent is accessible

### Execution

1. **Configure Target**:
   - Enter Windows host details
   - Test connection to verify accessibility
   - Save endpoint for future use

2. **Execute Programs**:
   - Enter message and title for the dialog program
   - Click "Execute on Windows" to run on current endpoint
   - Use saved endpoints for batch execution

### Endpoint Management

- **Save Endpoints**: Store frequently used Windows machines
- **Test Connections**: Verify accessibility before execution
- **Batch Execution**: Run on multiple endpoints simultaneously
- **Export Results**: Download execution logs

## Windows Agent Configuration

The agent runs on Windows endpoints and accepts HTTP requests from browsers.

### Default Configuration
- **Port**: 8080
- **Protocol**: HTTP (HTTPS optional)
- **Authentication**: Optional API key
- **Binaries Path**: `C:\ExecutableRunner\binaries\`

### Custom Configuration
```powershell
powershell.exe -File windows-agent.ps1 -Port 8080 -ApiKey "your-secret-key"
```

## Security Considerations

### Network Security
- Configure Windows Firewall to allow agent port
- Use VPN for remote access when possible
- Consider HTTPS for production environments

### Authentication
- Enable API key authentication for production
- Use strong passwords for Windows accounts
- Implement network-level access controls

## Troubleshooting

### Common Issues

**Cannot Connect to Windows Agent**:
```bash
# Test network connectivity
ping windows-host
telnet windows-host 8080
```

**Agent Not Starting**:
- Check Windows Event Viewer
- Verify PowerShell execution policy
- Run as Administrator

**CORS Errors in Browser**:
- Ensure agent is configured with proper CORS headers
- Check browser developer console for details

### Validation Commands

**Test Ubuntu Server**:
```bash
curl http://localhost:5000/config
```

**Test Windows Agent**:
```cmd
curl http://localhost:8080/status
```

## File Locations

### Ubuntu Host
- Web server: `client-direct-server.js`
- Interface files: `src/client-direct.html`, `src/client-direct.js`

### Windows Endpoints
- Agent: `C:\ExecutableRunner\windows-agent.ps1`
- Executables: `C:\ExecutableRunner\binaries\`
- Logs: `C:\ExecutableRunner\logs\`

## API Reference

### Windows Agent Endpoints

**Status Check**:
```
GET http://windows-host:8080/status
```

**Execute Program**:
```
POST http://windows-host:8080/execute
Content-Type: application/json

{
  "message": "Hello World",
  "title": "Test Dialog"
}
```

## Production Deployment

### Ubuntu Host
- Use process manager (PM2, systemd)
- Configure reverse proxy (nginx)
- Enable HTTPS with SSL certificates

### Windows Endpoints
- Install as Windows Service
- Enable HTTPS with certificates
- Configure API key authentication
- Set up monitoring and logging

## Monitoring

### Health Checks
```bash
# Ubuntu host status
curl http://ubuntu-host:5000/config

# Windows agent status
curl http://windows-host:8080/status
```

### Log Monitoring
- Ubuntu: Application logs via console
- Windows: `C:\ExecutableRunner\logs\agent.log`

This deployment provides a secure, scalable solution for browser-based Windows program execution across enterprise networks.