const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5000;
const SRC_DIR = path.join(__dirname, 'src');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
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

  if (req.method === 'POST' && req.url === '/execute') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { message, title } = JSON.parse(body);
        
        // Execute the dialog tool
        const dialogPath = path.join(__dirname, 'src-tauri/binaries/dialog-tool');
        const args = title ? [message, title] : [message];
        
        const child = spawn(dialogPath, args, {
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
            code: code
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        });
        
        child.on('error', (error) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: '',
            error: `Failed to execute: ${error.message}`,
            code: -1
          }));
        });
        
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: '',
          error: `Invalid request: ${error.message}`,
          code: -1
        }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(SRC_DIR, req.url === '/' ? 'index.html' : req.url);
  
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
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});