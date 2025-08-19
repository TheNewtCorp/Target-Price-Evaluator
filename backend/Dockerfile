# Use official Node.js runtime as base image with Playwright support
FROM mcr.microsoft.com/playwright:v1.54.2-jammy

# Set working directory
WORKDIR /usr/src/app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright browsers
RUN npx playwright install chromium

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/bash -c "App user" appuser \
    && chown -R appuser:appuser /usr/src/app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
