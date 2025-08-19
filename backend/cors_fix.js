// CORS configuration - More reliable production detection
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.PORT;
const allowedOrigins = isProduction 
  ? [
      'https://target-price-evaluator.onrender.com', 
      'https://targetpriceeval.netlify.app',
      'https://targetpriceeval.netlify.app/',
    ]
  : [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://127.0.0.1:5173'
    ];

console.log('CORS Debug:', { isProduction, allowedOrigins, NODE_ENV: process.env.NODE_ENV, RENDER: process.env.RENDER, PORT: process.env.PORT });

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  }),
);
