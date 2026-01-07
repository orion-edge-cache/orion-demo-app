import serverlessExpress from '@codegenie/serverless-express';
import { app } from './src/app';

let serverlessExpressInstance: any;

// Lambda handler function
export const handler = async (event: any, context: any) => {
  console.log('Lambda handler invoked', {
    requestId: context.awsRequestId,
    httpMethod: event.requestContext?.http?.method,
    path: event.rawPath,
  });

  // Create serverless express instance (will be reused on warm starts)
  if (!serverlessExpressInstance) {
    console.log('Creating new serverless-express instance');
    serverlessExpressInstance = serverlessExpress({ app });
  }

  try {
    const result = await serverlessExpressInstance(event, context);
    console.log('Request processed successfully', { statusCode: result.statusCode });
    return result;
  } catch (error) {
    console.error('Lambda handler error:', error);
    throw error;
  }
};
