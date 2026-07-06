import http from 'http';

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Data:', data.slice(0, 500)));
}).on('error', (e) => {
  console.error('Error:', e.message);
});
