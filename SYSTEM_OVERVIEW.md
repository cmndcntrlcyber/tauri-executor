# Direct Windows Execution System

## System Architecture

The application has been modified to use a client-direct execution model where:

1. **Ubuntu Host**: Serves web interface at port 5000
2. **Browser Client**: Connects directly to Windows endpoints
3. **Windows Agents**: Accept HTTP requests and execute programs
4. **No Proxying**: Ubuntu host does not proxy execution requests

## Key Components

### Ubuntu Web Server (`client-direct-server.js`)
- Serves static web interface files
- Provides configuration endpoint for client settings
- Local testing capability for validation
- CORS enabled for browser-to-Windows communication

### Browser Interface (`client-direct.html` + `client-direct.js`)
- Modern web interface for endpoint management
- Direct HTTP communication with Windows agents
- Batch execution across multiple endpoints
- Connection testing and status monitoring
- Endpoint persistence in browser localStorage

### Windows Agent (`windows-agent.ps1`)
- PowerShell HTTP listener on port 8080
- Enhanced CORS headers for browser compatibility
- Detailed status reporting with system information
- Secure executable path validation
- Comprehensive logging and error handling

## Execution Flow

1. User accesses web interface from Ubuntu host
2. User configures Windows endpoint (IP/hostname + port)
3. Browser tests connection directly to Windows agent
4. User saves endpoint for future use
5. Browser sends execution request directly to Windows agent
6. Windows agent executes program and returns results
7. Browser displays execution results

## Deployment Process

### Ubuntu Host Setup
```bash
node client-direct-server.js
# Access: http://ubuntu-host:5000
```

### Windows Endpoint Setup
```cmd
# Run as Administrator
deploy-windows.bat
C:\ExecutableRunner\start-agent.bat
```

### Usage
1. Open web interface in browser
2. Test local connection to verify Ubuntu host
3. Configure Windows endpoints with IP/hostname
4. Test connections to Windows agents
5. Save endpoints for reuse
6. Execute programs with message/title parameters
7. Monitor results and export logs

## Security Features

- CORS headers configured for browser access
- Optional API key authentication
- Executable path validation
- Windows Firewall integration
- PowerShell execution policy configuration
- Comprehensive audit logging

## Management Features

- Endpoint persistence and management
- Batch execution across multiple machines
- Connection status monitoring
- Execution result export
- System information display
- Real-time status indicators

The system successfully implements the requested architecture where browsers execute Windows programs directly via WMI/PowerShell without the Ubuntu host acting as a proxy.