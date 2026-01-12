/**
 * AWS Lambda handler for the demo app using GraphQL Yoga native handler
 */
import { yoga } from './yoga.js';
import { CURRENT_CONFIG } from './config.js';
export const handler = async (event, context) => {
    console.log('Lambda handler invoked', {
        requestId: context.awsRequestId,
        httpMethod: event.requestContext.http.method,
        path: event.rawPath,
    });
    // Handle health check endpoint directly
    if (event.rawPath === '/health') {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'ok',
                environment: CURRENT_CONFIG.environment,
                timestamp: new Date().toISOString(),
            }),
        };
    }
    // Handle error test endpoint (for testing 5xx error tracking)
    if (event.rawPath === '/error') {
        console.log('Error test endpoint invoked');
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Test server error',
                message: 'This is a deliberate 500 error for testing analytics error tracking',
                timestamp: new Date().toISOString(),
            }),
        };
    }
    try {
        // Build URL with query string
        const queryString = event.rawQueryString ? `?${event.rawQueryString}` : '';
        const url = `https://lambda.local${event.rawPath || '/graphql'}${queryString}`;
        // Convert Lambda event to Fetch Request
        const request = new Request(url, {
            method: event.requestContext.http.method,
            headers: event.headers,
            body: event.body || undefined,
        });
        // Use yoga's fetch handler
        const response = await yoga.fetch(request, { event, context });
        // Convert Fetch Response to Lambda response
        const responseBody = await response.text();
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        console.log('Request processed successfully', { statusCode: response.status });
        return {
            statusCode: response.status,
            headers,
            body: responseBody,
        };
    }
    catch (error) {
        console.error('Lambda handler error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
//# sourceMappingURL=lambda-handler.js.map