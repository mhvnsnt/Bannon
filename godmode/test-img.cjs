const http = require('http');

const data = JSON.stringify({
  messages: [{ role: 'user', content: 'Generate an image of a majestic lion', timestamp: new Date().toISOString() }],
  targetNode: 'Villainous-Core',
  intent: 'strategy'
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
