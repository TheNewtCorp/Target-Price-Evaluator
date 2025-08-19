/**
 * Health check script for Docker container
 * Used by Docker HEALTHCHECK to verify service is running
 */

const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  timeout: 3000,
  method: 'GET',
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.log('Health check failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('Health check timed out');
  request.destroy();
  process.exit(1);
});

request.end();
