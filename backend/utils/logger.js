const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.initializeLoggerSync();
  }

  initializeLoggerSync() {
    try {
      fsSync.accessSync(this.logDir);
    } catch (error) {
      // Directory doesn't exist, create it
      fsSync.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} metadata - Additional data
   * @returns {string} Formatted log entry
   */
  formatLogMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(metadata).length > 0 ? ` | META: ${JSON.stringify(metadata)}` : '';

    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}\n`;
  }

  /**
   * Write log to file
   * @param {string} filename - Log filename
   * @param {string} logEntry - Formatted log entry
   */
  async writeLogToFile(filename, logEntry) {
    try {
      const filePath = path.join(this.logDir, filename);
      await fs.appendFile(filePath, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {object} metadata - Additional data
   */
  async info(message, metadata = {}) {
    const logEntry = this.formatLogMessage('info', message, metadata);
    console.log(logEntry.trim());
    await this.writeLogToFile('app.log', logEntry);
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|object} error - Error object or metadata
   */
  async error(message, error = {}) {
    const metadata =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;

    const logEntry = this.formatLogMessage('error', message, metadata);
    console.error(logEntry.trim());
    await this.writeLogToFile('error.log', logEntry);
    await this.writeLogToFile('app.log', logEntry);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {object} metadata - Additional data
   */
  async warn(message, metadata = {}) {
    const logEntry = this.formatLogMessage('warn', message, metadata);
    console.warn(logEntry.trim());
    await this.writeLogToFile('app.log', logEntry);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {object} metadata - Additional data
   */
  async debug(message, metadata = {}) {
    // Only log debug messages in development
    if (process.env.NODE_ENV !== 'production') {
      const logEntry = this.formatLogMessage('debug', message, metadata);
      console.debug(logEntry.trim());
      await this.writeLogToFile('debug.log', logEntry);
    }
  }

  /**
   * Log scraping activity
   * @param {string} action - Scraping action
   * @param {object} details - Action details
   */
  async scraping(action, details = {}) {
    const message = `Scraping Action: ${action}`;
    const logEntry = this.formatLogMessage('scraping', message, details);
    console.log(logEntry.trim());
    await this.writeLogToFile('scraping.log', logEntry);
    await this.writeLogToFile('app.log', logEntry);
  }

  /**
   * Log evaluation request
   * @param {string} refNumber - Reference number being evaluated
   * @param {object} result - Evaluation result
   */
  async evaluation(refNumber, result = {}) {
    const message = `Price Evaluation: ${refNumber}`;
    const metadata = {
      refNumber,
      targetPrice: result.targetPrice,
      confidence: result.confidence,
      success: !!result.targetPrice,
    };

    const logEntry = this.formatLogMessage('evaluation', message, metadata);
    console.log(logEntry.trim());
    await this.writeLogToFile('evaluations.log', logEntry);
    await this.writeLogToFile('app.log', logEntry);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {object} metadata - Additional performance data
   */
  async performance(operation, duration, metadata = {}) {
    const message = `Performance: ${operation} completed in ${duration}ms`;
    const perfData = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    const logEntry = this.formatLogMessage('performance', message, perfData);
    console.log(logEntry.trim());
    await this.writeLogToFile('performance.log', logEntry);
  }

  /**
   * Clean old log files (older than specified days)
   * @param {number} days - Number of days to retain logs
   */
  async cleanOldLogs(days = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          await this.info(`Cleaned old log file: ${file}`);
        }
      }
    } catch (error) {
      await this.error('Failed to clean old logs', error);
    }
  }

  /**
   * Get log file contents
   * @param {string} logType - Log type (app, error, scraping, etc.)
   * @param {number} lines - Number of recent lines to retrieve
   * @returns {string} Log contents
   */
  async getLogContents(logType = 'app', lines = 100) {
    try {
      const filePath = path.join(this.logDir, `${logType}.log`);
      const content = await fs.readFile(filePath, 'utf8');

      if (lines > 0) {
        const allLines = content.split('\n');
        return allLines.slice(-lines).join('\n');
      }

      return content;
    } catch (error) {
      await this.error(`Failed to read log file: ${logType}.log`, error);
      return '';
    }
  }

  /**
   * Create a timer for performance logging
   * @param {string} operation - Operation name
   * @returns {function} Function to call when operation completes
   */
  startTimer(operation) {
    const startTime = Date.now();
    return async (metadata = {}) => {
      const duration = Date.now() - startTime;
      await this.performance(operation, duration, metadata);
      return duration;
    };
  }

  /**
   * Log system health check
   * @param {object} healthData - System health metrics
   */
  async health(healthData) {
    const message = 'System Health Check';
    const logEntry = this.formatLogMessage('health', message, healthData);
    console.log(logEntry.trim());
    await this.writeLogToFile('health.log', logEntry);
  }
}

module.exports = new Logger();
