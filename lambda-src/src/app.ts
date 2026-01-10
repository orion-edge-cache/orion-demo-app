/**
 * Express application with GraphQL Yoga
 */

import express from 'express';
import cors from 'cors';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema.js';
import { CURRENT_CONFIG } from './config.js';

export const PORT = CURRENT_CONFIG.port;

// Initialize the Express app
export const app = express();
app.use(express.json());
app.use(
  cors({
    origin: CURRENT_CONFIG.corsOrigin,
  })
);

// Request logging middleware
app.use('/', (req, res, next) => {
  const datetime = new Date().toISOString().slice(0, -5) + 'Z';
  console.log(`\x1b[1;33m[${datetime}] ${CURRENT_CONFIG.environment}\x1b[0m`);
  console.log(`METHOD: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`HEADERS: ${JSON.stringify(req.headers, null, 4)}`);
  console.log(`BODY: ${JSON.stringify(req.body, null, 4)}`);
  next();
});

// GraphQL Yoga setup
const yoga = createYoga({
  schema,
  parserAndValidationCache: false,
  plugins: [
    {
      onExecute: () => {
        console.log(`📡 GraphQL request in ${CURRENT_CONFIG.environment} environment`);
      },
      onResultProcess: () => {
        // A place to log info about post-graphql operations
      },
    },
  ],
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
