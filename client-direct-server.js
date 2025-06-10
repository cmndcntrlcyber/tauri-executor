const http = require('http');
const fs = require('fs');
const path = require('path');
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

const server = http.createServer((req, res) => {
  // Enable CORS for browser-to-Windows direct communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Configuration endpoint for client settings
  if (req.method === 'GET' && req.url === '/config') {
    const config = {
      serverInfo: {
        platform: os.platform(),
        hostname: os.hostname(),
        timestamp: new Date().toISOString()
      },
      executionModes: ['wmi_powershell', 'direct_api'],
      defaultPort: 8080,
      defaultTimeout: 60000,
      supportedProtocols: ['http', 'https']
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
    return;
  }

  // Local test execution endpoint (for testing purposes)
  if (req.method === 'POST' && req.url === '/test-local') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { message, title } = JSON.parse(body);
        const result = {
          success: true,
          message: `Local test successful: ${message}${title ? ` (${title})` : ''}`,
          error: '',
          code: 0,
          executionMode: 'local_test',
          hostname: os.hostname(),
          timestamp: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        const errorResult = {
          success: false,
          message: '',
          error: error.message,
          code: -1,
          timestamp: new Date().toISOString()
        };
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResult));
      }
    });
    return;
  }

  // Serve static files
  let requestPath = req.url === '/' ? 'client-direct.html' : req.url;
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Client-Direct Executable Runner Server running at http://0.0.0.0:${PORT}`);
  console.log(`Host platform: ${os.platform()} ${os.arch()}`);
  console.log('Clients will connect directly to Windows endpoints via browser');
});