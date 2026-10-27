import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { sendSuccess, sendError } from './utils.js';
import { connectDB, getDBStatus } from './db.js';

// Route imports
import authRoutes from './auth.js';
import { restaurantRouter, foodRouter } from './restaurants.js';
import orderRoutes from './orders.js';
import operationRoutes from './operations.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, postman) or any localhost port
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev to eliminate CORS blockers
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint (Includes live Database status)
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  return sendSuccess(res, 200, 'Foodie Delivery API is healthy and operational', {
    status: 'ONLINE',
    database: dbStatus,
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    paymentMethod: 'Cash on Delivery (COD) Only'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/food', foodRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/operations', operationRoutes);

// 404 Route Handler
app.use((req, res) => {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  // Gracefully handle malformed or empty JSON body errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'Invalid or empty JSON body. Please provide a valid JSON payload.');
  }

  console.error('[Unhandled Error]:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(
    res,
    statusCode,
    message,
    NODE_ENV === 'development' ? { stack: err.stack } : null
  );
});

// Initialize Database and Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] Foodie Backend running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`[Server Error] Failed to start server due to DB connection failure: ${error.message}`);
    // Still start server in fallback mode so health check can report DB status
    app.listen(PORT, () => {
      console.warn(`[Server Warning] Server started on port ${PORT} with DB disconnected. Check MongoDB connection.`);
    });
  }
};

startServer();

export default app;
