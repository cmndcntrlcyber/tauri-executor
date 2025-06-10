# Cross-Platform Executable Runner

A web-based application that allows you to execute Windows programs remotely from an Ubuntu host. The system provides multiple execution modes including SSH, WMI/PowerShell, and custom API endpoints.

## Architecture

- **Ubuntu Host**: Serves the web interface and coordinates execution
- **Windows Endpoints**: Run agent software to receive and execute commands
- **Web Interface**: Modern browser-based control panel
- **Multiple Protocols**: SSH, WMI, PowerShell, and custom API support

## Quick Start

### Ubuntu Host Setup

1. **Install the server**:
   ```bash
   sudo ./setup-cross-platform.sh
   ```

2. **Access the web interface**:
   - Open: `http://your-ubuntu-host:5000`
   - Use the cross-platform interface to configure execution

### Windows Endpoint Setup

1. **Deploy the agent**:
   ```cmd
   deploy-windows.bat
   ```

2. **Start the agent**:
   ```cmd
   C:\ExecutableRunner\start-agent.bat
   ```

3. **Copy your executables** to `C:\ExecutableRunner\binaries\`

## Execution Modes

### Local Execution
- Runs executables on the Ubuntu host
- Useful for testing and Linux-compatible programs

### Remote SSH
- Connects to Windows machines via SSH
- Requires SSH server on Windows (OpenSSH)
- Authentication via username/password or private key

### Remote WMI/PowerShell
- Uses Windows Management Instrumentation
- Native Windows remote execution
- Requires admin credentials

### Remote API
- Custom HTTP API endpoint
- Uses the Windows agent service
- Lightweight and secure

## Configuration

### Ubuntu Host Configuration

The server configuration is stored in `/opt/executable-runner/config.json`:

```json
{
  "server": {
    "port": 5000,
    "host": "0.0.0.0"
  },
  "execution": {
    "defaultTimeout": 60,
    "maxConcurrentJobs": 5
  },
  "security": {
    "enableApiKey": false,
    "allowedHosts": ["*"]
  }
}
```

### Windows Agent Configuration

The Windows agent can be configured with command-line parameters:

```powershell
powershell.exe -File windows-agent.ps1 -Port 8080 -LogPath "C:\logs\agent.log" -ExecutablesPath "C:\binaries" -ApiKey "your-secret-key"
```

## API Reference

### Execute Endpoint
`POST /execute`

Request body:
```json
{
  "message": "Hello World",
  "title": "Test Dialog",
  "endpoint": "192.168.1.100",
  "mode": "remote_api",
  "credentials": {
    "username": "user",
    "password": "pass",
    "apiKey": "key"
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Dialog executed successfully!",
  "error": "",
  "code": 0,
  "executionMode": "remote_api",
  "endpoint": "192.168.1.100",
  "timestamp": "2025-06-10T16:05:21.466Z"
}
```

### System Info Endpoint
`GET /system-info`

Returns Ubuntu host system information.

### Executables Endpoint
`GET /executables`

Lists available executables in the binaries directory.

## Security Considerations

### Network Security
- Configure firewalls to allow only necessary ports
- Use VPN for remote connections when possible
- Enable API key authentication for production

### Authentication
- Use strong passwords for Windows accounts
- Consider certificate-based SSH authentication
- Rotate API keys regularly

### Execution Security
- Validate all executable paths
- Implement execution timeouts
- Monitor and log all executions
- Use least-privilege accounts

## Troubleshooting

### Common Issues

**Connection Failed**:
- Check firewall settings on both Ubuntu and Windows
- Verify network connectivity: `ping target-host`
- Ensure Windows agent is running: `netstat -an | findstr 8080`

**Authentication Failed**:
- Verify credentials are correct
- Check Windows user account permissions
- For SSH: Ensure OpenSSH is installed and configured

**Execution Timeout**:
- Increase timeout in configuration
- Check executable permissions
- Monitor system resources

### Log Locations

**Ubuntu Host**:
- Service logs: `sudo journalctl -u executable-runner -f`
- Application logs: `/opt/executable-runner/logs/application.log`

**Windows Agent**:
- Agent logs: `C:\ExecutableRunner\logs\agent.log`
- Windows Event Viewer: Applications and Services Logs

## Development

### Adding New Execution Modes

1. Add mode to `EXECUTION_MODES` in `cross-platform-server.js`
2. Implement execution function following existing patterns
3. Update web interface to support new mode
4. Add configuration options as needed

### Custom Executables

To add your own executables:

1. **Ubuntu**: Copy to `/opt/executable-runner/binaries/`
2. **Windows**: Copy to `C:\ExecutableRunner\binaries\`
3. Ensure executable permissions are set correctly
4. Update any hardcoded paths in the application

## Monitoring

### Health Checks

**Ubuntu Host**:
```bash
curl http://localhost:5000/system-info
```

**Windows Agent**:
```cmd
curl http://localhost:8080/status
```

### Performance Monitoring

Monitor system resources during execution:
- CPU usage
- Memory consumption
- Network bandwidth
- Disk I/O

## Support

### Management Commands

**Ubuntu Host**:
- Start: `/opt/executable-runner/start.sh`
- Stop: `/opt/executable-runner/stop.sh`
- Status: `/opt/executable-runner/status.sh`
- Restart: `/opt/executable-runner/restart.sh`

**Windows Agent**:
- Start: `C:\ExecutableRunner\start-agent.bat`
- Stop: `C:\ExecutableRunner\stop-agent.bat`
- Uninstall: `C:\ExecutableRunner\uninstall.bat`

### Getting Help

1. Check the logs for error messages
2. Verify network connectivity and firewall settings
3. Test with local execution mode first
4. Ensure all credentials and paths are correct

## License

This project is provided as-is for educational and testing purposes. Use in production environments requires proper security review and testing.