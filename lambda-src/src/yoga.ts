/**
 * GraphQL Yoga instance
 *
 * Shared by both Lambda handler and Express server.
 * This file should have minimal dependencies to keep Lambda cold starts fast.
 */

import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema.js';
import { CURRENT_CONFIG } from './config.js';

export const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  parserAndValidationCache: false,
  plugins: [
    {
      onExecute: () => {
        console.log(`📡 GraphQL request in ${CURRENT_CONFIG.environment} environment`);
      },
    },
  ],
});
