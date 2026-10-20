/**
 * JOSEPH AI - Development Server with URL Routing Support
 * Run with: node server.js
 * This server ensures all routes (/finance, /interpretation, etc.) serve index.html
 * for client-side routing to work properly.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Get the file path
  let filePath = '.' + req.url;

  // If it's a directory or a route, serve index.html (for client-side routing)
  if (filePath === './') {
    filePath = './index.html';
  } else if (!path.extname(filePath)) {
    // No extension means it's a route like /finance, /login, /payment, etc.
    // First try to serve the .html file (e.g., /login -> login.html)
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
    } else {
      // If .html doesn't exist, serve index.html for SPA routing
      filePath = './index.html';
    }
  }

  // Get the file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found - serve index.html for client-side routing
        fs.readFile('./index.html', (err, content) => {
          if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Success - serve the file
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 JOSEPH AI Server Running:`);
  console.log(`   ➜  Local:   http://localhost:${PORT}`);
  console.log(`   ➜  Routes:  /, /dream, /interpretation, /finance, /strategy, /payment`);
  console.log(`\n✨ URL routing enabled - you can now deep link to any module!\n`);
});

// SR
