import express from 'express'
import cors from 'cors'
import jsonServer from 'json-server'
import path from 'path'
import { createYoga } from 'graphql-yoga'
import { schema } from './graphql/schema'
import { readFileSync, writeFileSync } from 'fs'

export const PORT = process.env.PORT || 3000

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
const dbDir = path.join(__dirname, 'db/json')
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

  console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
  console.log("===== REQUEST HEADERS")
  console.log(req.headers)
  console.log("===== REQUEST BODY")
  console.log(req.body)
  next()
})

app.post('/reset', (req, res) => {
  try {
    const users = JSON.parse(readFileSync(path.join(dbDir, 'users.json'), 'utf-8'))
    const posts = JSON.parse(readFileSync(path.join(dbDir, 'posts.json'), 'utf-8'))
    const comments = JSON.parse(readFileSync(path.join(dbDir, 'comments.json'), 'utf-8'))

    const db = { users, posts, comments }
    writeFileSync(dbJsonPath, JSON.stringify(db, null, 2))

    res.json({ success: true, message: 'Database reset successfully' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset database' })
  }
})

app.use('/graphql', yoga)
app.use('/graphql', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  next();
});


app.get('/', (req, res) => {
  res.send('hello')
})
