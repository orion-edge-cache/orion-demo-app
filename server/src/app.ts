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
  plugins: [
    {
      onExecute: ({ args }: { args: any }) => {
        console.log('GraphQL Execute:', args.operationName, args.variables)
      },
      onResultProcess: ({ result }) => {
        console.log('GraphQL Result:', result)
      }
    }
  ]
})

const dbJsonPath = path.join(__dirname, 'db/json/db.json')
const dbDir = path.join(__dirname, 'db/json')
const router = jsonServer.router(dbJsonPath)
const middlewares = jsonServer.defaults()

app.use('/api', middlewares)
app.use('/api', router)

app.use(express.json())
app.use(cors())

app.use('/', (req, res, next) => {
  console.log("\n\n===== REQUEST METHOD AND URL")
  console.log(req.method)
  console.log(req.url)
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

app.get('/', (req, res) => {
  res.send('hello')
})
