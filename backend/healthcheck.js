const http = require('http');

// Simple health check script for Docker
const options = {
  host: 'localhost',
  port: process.env.PORT || 3001,
  path: '/api/health',
  timeout: 3000,
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0); // Success
  } else {
    process.exit(1); // Failure
  }
});

request.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timeout');
  process.exit(1);
});

request.end();
