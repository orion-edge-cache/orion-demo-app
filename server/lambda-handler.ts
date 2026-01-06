import serverlessExpress from '@codegenie/serverless-express';
import { app, initializeApp } from './src/app';

let serverlessExpressInstance: any;

// Lambda handler function
export const handler = async (event: any, context: any) => {
  // Initialize app on first invocation (will handle S3 setup)
  await initializeApp();

  // Create serverless express instance (will be reused on warm starts)
  if (!serverlessExpressInstance) {
    serverlessExpressInstance = serverlessExpress({ app });
  }

  return serverlessExpressInstance(event, context);
};
