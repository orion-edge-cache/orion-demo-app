import express from 'express'
import cors from 'cors'
import jsonServer from 'json-server'
import { createYoga } from 'graphql-yoga'
import { schema } from './graphql/schema'

export const PORT = process.env.PORT || 3000

export const app = express()
const yoga = createYoga({
  schema,
  plugins: [
    {
      onExecute: ({ args }) => {
        console.log('GraphQL Execute:', args.operationName, args.variables)
      },
      onResultProcess: ({ result }) => {
        console.log('GraphQL Result:', result)
      }
    }
  ]
})

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

const router = jsonServer.router('src/db/json/db.json')
const middlewares = jsonServer.defaults()

app.use('/api', middlewares)
app.use('/api', router)
app.use('/graphql', yoga)

app.get('/', (req, res) => {
  res.send('hello')
})
