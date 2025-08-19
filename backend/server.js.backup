const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const chrono24Service = require('./services/playwrightChrono24Service');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://target-price-evaluator.onrender.com', 'https://targetpriceeval.netlify.app']
        : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'target-price-evaluator-backend',
  });
});

// Main evaluation endpoint
app.post('/api/evaluate', async (req, res) => {
  const startTime = Date.now();

  try {
    const { refNumber } = req.body;

    if (!refNumber || typeof refNumber !== 'string' || refNumber.trim() === '') {
      return res.status(400).json({
        error: 'Invalid reference number',
        message: 'Reference number is required and must be a non-empty string',
      });
    }

    logger.info(`Starting evaluation for reference number: ${refNumber}`);

    const result = await chrono24Service.evaluateWatch(refNumber.trim());

    const processingTime = Date.now() - startTime;
    logger.info(`Evaluation completed in ${processingTime}ms for reference: ${refNumber}`);

    res.status(200).json({
      success: true,
      data: result,
      processingTime: `${processingTime}ms`,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Evaluation failed:', {
      error: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`,
    });

    // Determine error type and response
    if (error.message.includes('403') || error.message.includes('blocked')) {
      res.status(403).json({
        error: 'Access denied',
        message: 'The request was blocked by anti-bot protection. Please try again later.',
      });
    } else if (error.message.includes('login')) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Unable to log into Chrono24. Please check credentials.',
      });
    } else if (error.message.includes('not found') || error.message.includes('No results')) {
      res.status(404).json({
        error: 'Watch not found',
        message: 'No results found for the specified reference number.',
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during evaluation.',
      });
    }
  }
});

// Test endpoint for checking service status
app.get('/api/test', async (req, res) => {
  try {
    const testResult = await chrono24Service.testConnection();
    res.status(200).json({
      success: true,
      message: 'Service connection test successful',
      data: testResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Service connection test failed',
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await chrono24Service.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await chrono24Service.cleanup();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`🚀 Target Price Evaluator Backend running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
