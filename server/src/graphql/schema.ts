import { createSchema } from 'graphql-yoga'
import { readFileSync } from 'fs'
import path from 'path'
import { resolvers } from './resolvers'

const typeDefs = readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8')

export const schema = createSchema({
  typeDefs,
  resolvers
})
