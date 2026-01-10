/**
 * AWS Lambda handler for the demo app
 */
import serverlessExpress from '@codegenie/serverless-express';
import { app } from './app.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serverlessExpressInstance;
// Lambda handler function
export const handler = async (event, context) => {
    console.log('Lambda handler invoked', {
        requestId: context.awsRequestId,
        httpMethod: event.requestContext?.http,
        path: event.rawPath ?? event.path,
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
    }
    catch (error) {
        console.error('Lambda handler error:', error);
        throw error;
    }
};
//# sourceMappingURL=lambda-handler.js.map