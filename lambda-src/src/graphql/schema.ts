/**
 * GraphQL schema definition
 */

import { createSchema } from 'graphql-yoga';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolvers } from './resolvers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typeDefs = readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

export const schema = createSchema({
  typeDefs,
  resolvers,
});
