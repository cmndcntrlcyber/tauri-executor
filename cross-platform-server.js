const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

const PORT = 5000;
const SRC_DIR = path.join(__dirname, 'src');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Configuration for different execution modes
const EXECUTION_MODES = {
  LOCAL: 'local',           // Execute locally (Ubuntu)
  REMOTE_SSH: 'remote_ssh', // Execute via SSH on Windows
  REMOTE_WMI: 'remote_wmi', // Execute via WMI/PowerShell
  REMOTE_API: 'remote_api'  // Execute via custom API endpoint
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Execute endpoint for cross-platform execution
  if (req.method === 'POST' && req.url === '/execute') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { message, title, endpoint, mode, credentials } = JSON.parse(body);
        executeOnTarget(message, title, endpoint, mode, credentials, res);
      } catch (error) {
        sendErrorResponse(res, `Invalid request: ${error.message}`);
      }
    });
    return;
  }

  // Get available executables endpoint
  if (req.method === 'GET' && req.url === '/executables') {
    getAvailableExecutables(res);
    return;
  }

  // Get system info endpoint
  if (req.method === 'GET' && req.url === '/system-info') {
    getSystemInfo(res);
    return;
  }

  // Serve static files
  let requestPath = req.url === '/' ? 'cross-platform.html' : req.url;
  let filePath = path.join(SRC_DIR, requestPath);
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('File not found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

function executeOnTarget(message, title, endpoint, mode, credentials, res) {
  console.log(`Executing on target: ${endpoint || 'local'} with mode: ${mode || 'local'}`);
  
  switch (mode) {
    case EXECUTION_MODES.LOCAL:
      executeLocal(message, title, res);
      break;
    case EXECUTION_MODES.REMOTE_SSH:
      executeRemoteSSH(message, title, endpoint, credentials, res);
      break;
    case EXECUTION_MODES.REMOTE_WMI:
      executeRemoteWMI(message, title, endpoint, credentials, res);
      break;
    case EXECUTION_MODES.REMOTE_API:
      executeRemoteAPI(message, title, endpoint, credentials, res);
      break;
    default:
      executeLocal(message, title, res);
  }
}

function executeLocal(message, title, res) {
  const isWindows = os.platform() === 'win32';
  const executablePath = isWindows 
    ? path.join(__dirname, 'src-tauri/binaries/dialog-tool-x86_64-pc-windows-msvc.exe')
    : path.join(__dirname, 'src-tauri/binaries/dialog-tool');
  
  const args = title ? [message, title] : [message];
  
  const child = spawn(executablePath, args, {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let stdout = '';
  let stderr = '';
  
  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  
  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });
  
  child.on('close', (code) => {
    const result = {
      success: code === 0,
      message: stdout.trim(),
      error: stderr.trim(),
      code: code,
      executionMode: 'local',
      platform: os.platform(),
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  });
  
  child.on('error', (error) => {
    sendErrorResponse(res, `Local execution failed: ${error.message}`);
  });
}

function executeRemoteSSH(message, title, endpoint, credentials, res) {
  if (!credentials || !credentials.username) {
    sendErrorResponse(res, 'SSH credentials required');
    return;
  }

  const args = title ? `"${message}" "${title}"` : `"${message}"`;
  const remoteCommand = `C:\\path\\to\\dialog-tool.exe ${args}`;
  
  // SSH command to execute on Windows
  const sshCommand = credentials.privateKey
    ? `ssh -i "${credentials.privateKey}" -o StrictHostKeyChecking=no ${credentials.username}@${endpoint} "${remoteCommand}"`
    : `sshpass -p "${credentials.password}" ssh -o StrictHostKeyChecking=no ${credentials.username}@${endpoint} "${remoteCommand}"`;
  
  exec(sshCommand, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      sendErrorResponse(res, `SSH execution failed: ${error.message}`);
      return;
    }
    
    const result = {
      success: true,
      message: stdout.trim(),
      error: stderr.trim(),
      code: 0,
      executionMode: 'remote_ssh',
      endpoint: endpoint,
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  });
}

function executeRemoteWMI(message, title, endpoint, credentials, res) {
  if (!credentials || !credentials.username || !credentials.password) {
    sendErrorResponse(res, 'WMI credentials (username/password) required');
    return;
  }

  const args = title ? `"${message}" "${title}"` : `"${message}"`;
  const remoteCommand = `C:\\path\\to\\dialog-tool.exe ${args}`;
  
  // PowerShell command to execute via WMI
  const psCommand = `
    $credential = New-Object System.Management.Automation.PSCredential("${credentials.username}", (ConvertTo-SecureString "${credentials.password}" -AsPlainText -Force))
    Invoke-Command -ComputerName "${endpoint}" -Credential $credential -ScriptBlock { ${remoteCommand} }
  `;
  
  exec(`powershell -Command "${psCommand}"`, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      sendErrorResponse(res, `WMI execution failed: ${error.message}`);
      return;
    }
    
    const result = {
      success: true,
      message: stdout.trim(),
      error: stderr.trim(),
      code: 0,
      executionMode: 'remote_wmi',
      endpoint: endpoint,
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  });
}

function executeRemoteAPI(message, title, endpoint, credentials, res) {
  const postData = JSON.stringify({
    message: message,
    title: title,
    apiKey: credentials ? credentials.apiKey : undefined
  });
  
  const options = {
    hostname: endpoint.split(':')[0],
    port: endpoint.split(':')[1] || 443,
    path: '/execute',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      ...(credentials && credentials.apiKey && { 'Authorization': `Bearer ${credentials.apiKey}` })
    },
    timeout: 30000
  };
  
  const protocol = endpoint.startsWith('https://') ? https : http;
  const req = protocol.request(options, (apiRes) => {
    let data = '';
    
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    
    apiRes.on('end', () => {
      try {
        const result = JSON.parse(data);
        result.executionMode = 'remote_api';
        result.endpoint = endpoint;
        result.timestamp = new Date().toISOString();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        sendErrorResponse(res, `API response parsing failed: ${error.message}`);
      }
    });
  });
  
  req.on('error', (error) => {
    sendErrorResponse(res, `API execution failed: ${error.message}`);
  });
  
  req.on('timeout', () => {
    req.destroy();
    sendErrorResponse(res, 'API request timeout');
  });
  
  req.write(postData);
  req.end();
}

function getAvailableExecutables(res) {
  const binariesDir = path.join(__dirname, 'src-tauri/binaries');
  
  if (!fs.existsSync(binariesDir)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ executables: [] }));
    return;
  }
  
  fs.readdir(binariesDir, (err, files) => {
    if (err) {
      sendErrorResponse(res, `Failed to read binaries directory: ${err.message}`);
      return;
    }
    
    const executables = files.filter(file => {
      const ext = path.extname(file);
      return ext === '.exe' || ext === '' || ext === '.bin';
    }).map(file => ({
      name: file,
      platform: file.includes('windows') || file.endsWith('.exe') ? 'windows' : 'linux',
      path: path.join(binariesDir, file)
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ executables }));
  });
}

function getSystemInfo(res) {
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    release: os.release(),
    uptime: os.uptime(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length,
    supportedModes: Object.values(EXECUTION_MODES),
    serverTime: new Date().toISOString()
  };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(systemInfo));
}

function sendErrorResponse(res, message) {
  const error = {
    success: false,
    message: '',
    error: message,
    code: -1,
    timestamp: new Date().toISOString()
  };
  
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(error));
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Cross-platform Executable Runner Server running at http://0.0.0.0:${PORT}`);
  console.log(`Host platform: ${os.platform()} ${os.arch()}`);
  console.log(`Supported execution modes: ${Object.values(EXECUTION_MODES).join(', ')}`);
});