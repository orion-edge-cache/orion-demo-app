import express from "express";
import cors from "cors";
import jsonServer from "json-server";
import path from "path";
import { createYoga } from "graphql-yoga";
import { schema } from "./graphql/schema";
import { CURRENT_CONFIG } from "./config";

export const PORT = CURRENT_CONFIG.port;

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

const dbJsonPath = path.join(__dirname, "db/json/db.json");
const router = jsonServer.router(dbJsonPath);

app.use("/api", (_req, _res, next) => {
  router.db.read();
  next();
});
app.use("/api", router);

app.use("/", (req, res, next) => {
  const datetime = new Date().toISOString().slice(0, -5) + "Z";
  console.log(`\x1b[1;33m[${datetime}] CloudFront\x1b[0m`);
  console.log(`METHOD: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`BODY: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

app.use("/graphql", yoga);
