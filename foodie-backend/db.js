import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB with retry logic and event listeners
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[Database Error]: MONGODB_URI is not defined in environment variables.');
    throw new Error('MONGODB_URI is required');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    throw error;
  }
};

// Monitor connection events
mongoose.connection.on('connected', () => {
  console.log('[Database Event] Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Event] Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database Event] Mongoose connection disconnected');
});

// Helper to get connection status
export const getDBStatus = () => {
  const states = {
    0: 'DISCONNECTED',
    1: 'CONNECTED',
    2: 'CONNECTING',
    3: 'DISCONNECTING'
  };
  return states[mongoose.connection.readyState] || 'UNKNOWN';
};

export default connectDB;
