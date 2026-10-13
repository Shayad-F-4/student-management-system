import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Ensure environment variables from .env take precedence
dotenv.config({ override: true });

/**
 * Global cache object for Mongoose connection.
 * In a serverless runtime (like Vercel AWS Lambda), global variables persist
 * across invocations as long as the execution container remains warm.
 * This prevents creating a new connection on every single API request,
 * avoiding connection pool exhaustion.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB using Mongoose with connection pooling and caching.
 * @returns {Promise<typeof mongoose>} The Mongoose instance
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // Validate that connection string exists
  if (!uri || uri.trim() === '') {
    const errorMsg = 'MONGODB_URI is not defined in environment variables. Please configure .env or Vercel Environment Variables.';
    console.error(`[Database Error] ❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // If a connection is already established and ready, reuse it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection promise is not already in flight, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose buffering to fail fast if disconnected
      maxPoolSize: 10,       // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    };

    console.log('🔄 Attempting connection to MongoDB...');

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        const host = mongooseInstance.connection.host || 'cluster';
        const dbName = mongooseInstance.connection.name || 'default';
        console.log(`✅ MongoDB Connected Successfully: Host=${host} | Database=${dbName}`);
        return mongooseInstance;
      })
      .catch((err) => {
        console.error(`❌ MongoDB Connection Failed: ${err.message}`);
        cached.promise = null; // Reset promise so subsequent requests can retry
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null; // Clear cached promise on failure
    throw err;
  }
};

export default connectDB;
