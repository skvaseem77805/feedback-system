const http = require('http');
const url = 'http://localhost:3002/api/students?limit=5';
http.get(url, (res) => {
  console.log('STATUS', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('BODY', data);
  });
}).on('error', (err) => {
  console.error('REQUEST ERROR', err.message);
});
