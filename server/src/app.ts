import express from 'express'
import cors from 'cors'
import jsonServer from 'json-server'
import { createYoga } from 'graphql-yoga'
import { schema } from './graphql/schema'

export const PORT = process.env.PORT || 3000

export const app = express()
const yoga = createYoga({
  schema
})

app.use(express.json())
app.use(cors())

const router = jsonServer.router('src/db/json/db.json')
const middlewares = jsonServer.defaults()

app.use('/api', middlewares)
app.use('/api', router)
app.use('/graphql', yoga)

app.get('/', (req, res) => {
  res.send('hello')
})
