import express from 'express'
import cors from 'cors'
import jsonServer from 'json-server'
import path from 'path'
import { createYoga } from 'graphql-yoga'
import { schema } from './graphql/schema'

export const PORT = process.env.AWS_LOCALHOST_PORT || 3000

export const app = express()
const yoga = createYoga({
  schema,
  parserAndValidationCache: false,
  plugins: [
    {
      onExecute: ({ args }: { args: any }) => {
        // a place to log info about graphql operations
      },
      onResultProcess: ({ result }) => {
        // a place to log info about post-graphql operations
      }
    }
  ]
})

const dbJsonPath = path.join(__dirname, 'db/json/db.json')
const router = jsonServer.router(dbJsonPath)

app.use('/api', (_req, _res, next) => {
  router.db.read()
  next()
})
app.use('/api', router)

app.use(express.json())
app.use(cors())

app.use('/', (req, res, next) => {
  const timestamp = new Date().toISOString().slice(0, 19) + 'Z'; // Zulu format without milliseconds (e.g., 2023-10-01T12:00:00Z)

  console.log(`\n\x1b[1;33m[${timestamp}]\x1b[0m ${req.method} ${req.url}`);
  console.log("\x1b[1;31mREQUEST HEADERS\x1b[0m")
  console.log(req.headers)
  console.log("\x1b[1;31mREQUEST BODY\x1b[0m")
  console.log(req.body)
  next()
})

app.use('/graphql', yoga)
// app.use('/graphql', (req, res, next) => {
//   res.setHeader('Cache-Control', 'public, max-age=300');
//   next();
// });
