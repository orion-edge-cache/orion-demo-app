/**
 * AWS Lambda handler for the demo app
 */

import serverlessExpress from '@codegenie/serverless-express';
import { app } from './app.js';
import type { Context } from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serverlessExpressInstance: any;

// Lambda handler function
export const handler = async (
  event: Record<string, unknown>,
  context: Context
): Promise<unknown> => {
  console.log('Lambda handler invoked', {
    requestId: context.awsRequestId,
    httpMethod: (event.requestContext as Record<string, unknown>)?.http,
    path: event.rawPath ?? event.path,
  });

  // Create serverless express instance (will be reused on warm starts)
  if (!serverlessExpressInstance) {
    console.log('Creating new serverless-express instance');
    serverlessExpressInstance = serverlessExpress({ app });
  }

  try {
    const result = await serverlessExpressInstance(event, context);
    console.log('Request processed successfully', { statusCode: (result as Record<string, unknown>).statusCode });
    return result;
  } catch (error) {
    console.error('Lambda handler error:', error);
    throw error;
  }
};
