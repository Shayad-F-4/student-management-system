import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import studentRoutes from './routes/studentRoutes.js';
import summaryHandler from './api/summary.js';

// Load environment variables (.env overrides shell env)
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// 1. Core Middleware
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle malformed JSON request bodies gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload. Please verify your request body syntax.',
    });
  }
  next();
});

// ==========================================
// 2. Static File Serving (Frontend)
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 3. API Routes
// ==========================================

// Health Check Endpoint (useful for verifying connection status)
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    status: 'online',
    database: isConnected ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

// CRUD API Routes for Students
app.use('/api/students', studentRoutes);

// Serverless Summary Endpoint (Mounted in Express for seamless local development)
app.get('/api/summary', summaryHandler);

// ==========================================
// 4. 404 & Global Error Handling
// ==========================================

// Handle unknown API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Serve frontend for root/HTML navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==========================================
// 5. Server Startup (Local Runtime)
// ==========================================
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 Student Management System is running!`);
        console.log(`🌐 Local Web UI:         http://localhost:${PORT}`);
        console.log(`🎓 CRUD REST Endpoints:  http://localhost:${PORT}/api/students`);
        console.log(`📊 Summary Endpoint:     http://localhost:${PORT}/api/summary`);
        console.log(`🩺 Health Endpoint:      http://localhost:${PORT}/api/health`);
        console.log(`=======================================================`);
      });
    })
    .catch((err) => {
      console.warn(`⚠️ Warning: Starting server despite database connection failure: ${err.message}`);
      app.listen(PORT, () => {
        console.log(`🚀 Server started on port ${PORT} (Database pending connection).`);
      });
    });
}

export default app;
