/**
 * Express app for local development
 *
 * This file is NOT loaded in Lambda - only yoga.ts is used there.
 * Run locally with: npm run dev
 */

import express from 'express';
import cors from 'cors';
import { yoga } from './yoga.js';
import { CURRENT_CONFIG } from './config.js';

export const PORT = CURRENT_CONFIG.port;

// Express app for local development only
export const app = express();
app.use(express.json());
app.use(
  cors({
    origin: CURRENT_CONFIG.corsOrigin,
  })
);

// Request logging middleware (local dev only)
app.use('/', (req, res, next) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: CURRENT_CONFIG.environment,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  }));
  next();
});

// Mount GraphQL endpoint
app.use('/graphql', yoga);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: CURRENT_CONFIG.environment,
    timestamp: new Date().toISOString(),
  });
});

// Error test endpoint (for testing 5xx error tracking)
app.get('/error', (req, res) => {
  res.status(500).json({
    error: 'Test server error',
    message: 'This is a deliberate 500 error for testing analytics error tracking',
    timestamp: new Date().toISOString(),
  });
});
