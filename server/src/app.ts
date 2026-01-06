import express from "express";
import cors from "cors";
import jsonServer from "json-server";
import path from "path";
import { createYoga } from "graphql-yoga";
import { schema } from "./graphql/schema";
import { CURRENT_CONFIG } from "./config";
import { initializeS3Storage, syncDBToS3, getDBPath } from "./db/s3-manager";

export const PORT = CURRENT_CONFIG.port;

// Flag to track if app is initialized
let isInitialized = false;

// Initialize the Express app
export const initializeApp = async (): Promise<express.Application> => {
  if (isInitialized) {
    return app;
  }

  // Initialize S3 storage if in Lambda environment
  await initializeS3Storage();

  isInitialized = true;
  return app;
};

export const app = express();

app.use(express.json());
app.use(
  cors({
    origin: CURRENT_CONFIG.corsOrigin,
  }),
);

const yoga = createYoga({
  schema,
  parserAndValidationCache: false,
  plugins: [
    {
      onExecute: ({ args }: { args: any }) => {
        console.log(
          `📡 GraphQL request in ${CURRENT_CONFIG.environment} environment`,
        );
      },
      onResultProcess: ({ result }) => {
        // a place to log info about post-graphql operations
      },
    },
  ],
});

// Use the appropriate db.json path based on environment
const dbJsonPath = getDBPath();
console.log(`Using database at: ${dbJsonPath}`);
const router = jsonServer.router(dbJsonPath);

// Middleware to sync db.json to S3 after mutations
app.use("/api", async (req, res, next) => {
  router.db.read();
  
  // Hook into the response to sync after write operations
  const originalSend = res.send;
  res.send = function (data: any) {
    res.send = originalSend;
    
    // If this was a POST, PUT, PATCH, or DELETE, sync to S3
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      syncDBToS3().catch(err => {
        console.error('Error syncing to S3:', err);
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

app.use("/api", router);

app.use("/", (req, res, next) => {
  const datetime = new Date().toISOString().slice(0, -5) + "Z";
  console.log(`\x1b[1;33m[${datetime}] ${CURRENT_CONFIG.environment}\x1b[0m`);
  console.log(`METHOD: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`BODY: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

app.use("/graphql", yoga);
