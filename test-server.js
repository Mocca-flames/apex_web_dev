const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/MauriX/Documents/apex_web';

var server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  var filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  var ext = path.extname(filePath);
  var mime = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.json': 'application/json',
    '.webp': 'image/webp',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.ico':  'image/x-icon'
  }[ext] || 'application/octet-stream';

  fs.readFile(filePath, function(err, data) {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(8766, function() { console.log('[test-server] on http://localhost:8766'); });
