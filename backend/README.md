# Target Price Evaluator Backend

This is the backend service for the Target Price Evaluator application. It provides web scraping functionality to gather luxury watch pricing data from Chrono24.com.

## Features

- **Headless Chrome Scraping**: Uses Puppeteer to navigate Chrono24.com
- **Anti-Bot Detection**: Implements human-like behavior to avoid detection
- **Session Management**: Persistent login sessions with cookie storage
- **Price Analysis**: Calculates target prices based on market data
- **Performance Monitoring**: Comprehensive logging and metrics
- **Docker Support**: Ready for deployment on Render.com

## Setup

### Prerequisites

- Node.js 18 or higher
- Chrome/Chromium browser (for local development)
- Docker (for containerized deployment)

### Local Development

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the backend directory:

   ```env
   NODE_ENV=development
   PORT=3001
   CHRONO24_EMAIL=your_email@example.com
   CHRONO24_PASSWORD=your_password
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Build Docker Image**

   ```bash
   docker build -t target-price-backend .
   ```

2. **Run Container**
   ```bash
   docker run -p 3001:3001 --env-file .env target-price-backend
   ```

## API Endpoints

### POST /api/evaluate

Evaluates the target price for a luxury watch.

**Request Body:**

```json
{
  "refNumber": "126610LN"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "refNumber": "126610LN",
    "targetPrice": 12000,
    "marketAverage": 15000,
    "confidence": "High",
    "priceRange": {
      "min": 15000,
      "max": 15500,
      "spreadPercentage": 3.33
    },
    "calculation": {
      "multiplier": 0.8,
      "basedOnMinPrice": 15000
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/health

Returns the health status of the service.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 45.2,
    "total": 512
  }
}
```

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
