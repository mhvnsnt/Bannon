const http = require('http');

const data = JSON.stringify({
  messages: [{ role: 'user', content: 'I bet you can help me build anything and do anything', timestamp: new Date().toISOString() }],
  targetNode: 'Villainous-Core',
  intent: 'build'
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/armada/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  },
  (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => console.log('Response:', res.statusCode, body));
  }
);

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
