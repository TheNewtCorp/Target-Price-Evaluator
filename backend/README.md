# Target Price Evaluator Backend

A Node.js backend service for evaluating watch prices using Playwright automation to scrape Chrono24.com.

## 🚀 Features

- **Playwright Automation**: Advanced headless browser automation with anti-bot detection
- **Fresh Browser Sessions**: Each evaluation uses a new browser instance for reliability
- **Anti-Detection Measures**: WebGL spoofing, WebDriver removal, realistic user behavior
- **Florida Geolocation**: Emulates US-based browsing for consistent pricing
- **Production Ready**: Optimized for Render.com deployment

## 📦 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Production Deployment (Render.com)

1. **Connect Repository**: Link your GitHub repo to Render.com
2. **Select Service Type**: Choose "Web Service"
3. **Configuration**:
   ```
   Build Command: npm install && npx playwright install chromium
   Start Command: npm start
   ```
4. **Environment Variables**:
   ```
   NODE_ENV=production
   HEADLESS=true
   PORT=3001
   LOG_LEVEL=info
   ```

## 🔧 API Endpoints

### Health Check

```http
GET /health
```

### Evaluate Watch Price

```http
POST /api/evaluate
Content-Type: application/json

{
  "refNumber": "326.30.40.50.06.001"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "refNumber": "326.30.40.50.06.001",
    "minPrice": 2889,
    "maxPrice": 3547,
    "avgPrice": 3218,
    "targetPrice": 2311,
    "confidence": "High",
    "priceRange": {
      "min": 2889,
      "max": 3547,
      "spreadPercentage": 23
    },
    "timestamp": "2025-08-19T20:15:49.632Z"
  },
  "processingTime": "52000ms"
}
```

## 🛡️ Anti-Detection Features

- WebDriver signature removal
- WebGL fingerprinting resistance
- Screen property spoofing
- Chrome runtime mocking
- Human-like typing patterns
- Random delays and mouse movements
- Fresh browser sessions

## 📊 Performance

- **Processing Time**: ~45-60 seconds per evaluation
- **Success Rate**: 95%+ with anti-detection measures
- **Concurrent Requests**: Supported (each gets fresh browser)
- **Memory Usage**: ~200MB per browser instance

## 🔒 Security

- No persistent browser sessions
- Automatic resource cleanup
- Non-root Docker user
- Input validation and sanitization
- Error handling without data exposure

## 📈 Monitoring

The service provides detailed logging for:

- Evaluation requests and results
- Performance metrics
- Error tracking
- System health

## 🚨 Important Notes

### For Production:

- Set `HEADLESS=true` for server deployment
- Configure proper CORS origins
- Monitor resource usage (memory/CPU)
- Set up log rotation for long-term operation

### Rate Limiting:

- Built-in delays prevent detection
- Consider implementing API rate limiting for public deployment
- Each evaluation creates a fresh browser (resource intensive)

## 📄 Environment Variables

| Variable       | Default       | Description                   |
| -------------- | ------------- | ----------------------------- |
| `NODE_ENV`     | `development` | Environment mode              |
| `PORT`         | `3001`        | Server port                   |
| `HEADLESS`     | `false`       | Run browser in headless mode  |
| `LOG_LEVEL`    | `info`        | Logging level                 |
| `MIN_DELAY_MS` | `1000`        | Minimum delay between actions |
| `MAX_DELAY_MS` | `3000`        | Maximum delay between actions |

## 🐳 Docker Support

```bash
# Build image
docker build -t target-price-evaluator .

# Run container
docker run -p 3001:3001 -e NODE_ENV=production -e HEADLESS=true target-price-evaluator
```

## 📝 License

This project is proprietary and not licensed for public use.

## Architecture

### Core Services

- **`server.js`**: Express.js server with API endpoints
- **`chrono24Service.js`**: Main scraping logic for Chrono24.com
- **`cookieManager.js`**: Handles session persistence
- **`humanBehavior.js`**: Simulates human-like interactions

### Utilities

- **`priceCalculator.js`**: Handles price calculations and formatting
- **`logger.js`**: Comprehensive logging system

### Directory Structure

```
backend/
├── server.js                 # Main Express server
├── services/
│   ├── chrono24Service.js     # Chrono24 scraping service
│   ├── cookieManager.js       # Session management
│   └── humanBehavior.js       # Anti-bot behavior
├── utils/
│   ├── priceCalculator.js     # Price calculation logic
│   └── logger.js              # Logging utilities
├── logs/                      # Log files directory
├── cookies/                   # Session storage
├── Dockerfile                 # Docker configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Environment Variables

| Variable            | Description                          | Default     | Required |
| ------------------- | ------------------------------------ | ----------- | -------- |
| `NODE_ENV`          | Environment (development/production) | development | No       |
| `PORT`              | Server port                          | 3001        | No       |
| `CHRONO24_EMAIL`    | Chrono24 account email               | -           | Yes      |
| `CHRONO24_PASSWORD` | Chrono24 account password            | -           | Yes      |

## Scraping Process

The backend follows a 6-step process to gather pricing data:

1. **Navigation**: Navigate to Chrono24.com with human-like timing
2. **Authentication**: Login using provided credentials
3. **Search**: Search for the specified watch reference number
4. **Results**: Navigate to search results and find listings
5. **Data Collection**: Extract price ranges from listings
6. **Analysis**: Calculate target price (80% of minimum price)

## Anti-Bot Measures

To avoid detection by Chrono24's anti-bot systems:

- **Realistic Timing**: Random delays between actions (1-3 seconds)
- **Human-like Typing**: Simulated typing speed (50-120ms per character)
- **Mouse Movements**: Random mouse movements and scrolling
- **Session Persistence**: Maintains login sessions between requests
- **User Agent Rotation**: Uses realistic Chrome user agents
- **Viewport Simulation**: Randomizes browser window sizes

## Logging

The application provides comprehensive logging:

- **Application Logs**: General application events (`app.log`)
- **Error Logs**: Error tracking and stack traces (`error.log`)
- **Scraping Logs**: Detailed scraping activities (`scraping.log`)
- **Performance Logs**: Timing and performance metrics (`performance.log`)
- **Evaluation Logs**: Price evaluation results (`evaluations.log`)

## Error Handling

The service handles various error scenarios:

- **403 Forbidden**: Anti-bot detection triggered
- **Login Failures**: Invalid credentials or blocked account
- **Element Not Found**: Page structure changes
- **Network Issues**: Connection timeouts and failures
- **Invalid Data**: Malformed price data or search results

## Performance

- **Request Timeout**: 60 seconds per evaluation
- **Memory Usage**: Optimized for low memory environments
- **Concurrent Requests**: Limited to prevent resource exhaustion
- **Cache Strategy**: Session cookies cached for 24 hours

## Security

- **Input Validation**: All inputs sanitized and validated
- **Environment Variables**: Sensitive data stored in environment
- **Non-root User**: Docker container runs as non-privileged user
- **CORS Protection**: Restricted cross-origin requests
- **Helmet Security**: Security headers enabled

## Deployment on Render.com

1. **Connect Repository**: Link your GitHub repository to Render
2. **Create Web Service**: Select "Docker" as the environment
3. **Environment Variables**: Configure required environment variables
4. **Deploy**: Render will build and deploy automatically

### Render Configuration

- **Service Type**: Web Service
- **Environment**: Docker
- **Build Command**: `docker build -t target-price-backend .`
- **Start Command**: `docker run -p $PORT:3001 target-price-backend`

## Troubleshooting

### Common Issues

1. **Chrome not found**
   - Ensure Chrome is installed in Docker image
   - Check Puppeteer configuration

2. **403 Forbidden errors**
   - Increase delays between actions
   - Verify human behavior simulation
   - Check if IP is blocked

3. **Login failures**
   - Verify credentials in environment variables
   - Check for account lockouts
   - Update login selectors if changed

4. **Memory issues**
   - Increase Docker memory limits
   - Optimize browser settings
   - Close browser instances properly

### Debug Mode

Enable debug logging by setting `NODE_ENV=development`:

```bash
NODE_ENV=development npm start
```

## License

This project is for educational purposes only. Please respect Chrono24's terms of service and robots.txt when using this scraper.

## Support

For issues or questions, please refer to the application logs or contact the development team.
