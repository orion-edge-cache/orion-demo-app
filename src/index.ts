/**
 * @orion/demo-app
 * 
 * Deploy a demo GraphQL app to AWS Lambda for testing Orion edge cache.
 * 
 * This package provides a self-contained demo GraphQL application that can be
 * deployed to AWS Lambda with a React frontend hosted on S3. It's designed to
 * give users a working GraphQL endpoint to test Orion's edge caching capabilities.
 */

// Main functions
export { deployDemoApp } from './deploy.js';
export { destroyDemoApp } from './destroy.js';
export { getDemoAppStatus, checkDemoAppDeployed } from './status.js';

// Types
export type {
  DemoAppConfig,
  DemoAppAwsConfig,
  DemoAppOutputs,
  DemoAppStatus,
  ProgressEvent,
  ProgressCallback,
} from './types.js';

// Paths (for consumers who need them)
export {
  DEMO_APP_TFSTATE_PATH,
  ORION_CONFIG_DIR,
  DEPLOYMENT_CONFIG_PATH,
} from './config.js';
