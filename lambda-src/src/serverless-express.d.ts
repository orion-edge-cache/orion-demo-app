declare module '@codegenie/serverless-express' {
  import { Application } from 'express';

  interface ServerlessExpressOptions {
    app: Application;
  }

  function serverlessExpress(options: ServerlessExpressOptions): (event: unknown, context: unknown) => Promise<unknown>;

  export default serverlessExpress;
}
