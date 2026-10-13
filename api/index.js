import app from '../server.js';
import connectDB from '../config/db.js';

/**
 * Vercel Serverless Function entry point for Express API routes.
 * When deployed to Vercel, this serverless handler handles all
 * `/api/students` and other backend Express endpoints.
 */
export default async function handler(req, res) {
  // Ensure cached MongoDB connection is initialized before handling request
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error in Vercel function:', error);
  }

  return app(req, res);
}
