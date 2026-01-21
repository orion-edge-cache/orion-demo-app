/**
 * Type definitions for @orion/demo-app
 */

export interface DemoAppAwsConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  useEnv?: boolean;
}

export interface DemoAppConfig {
  aws: DemoAppAwsConfig;
}

export interface DemoAppOutputs {
  graphqlEndpoint: string;
  lambdaFunctionName: string;
  awsRegion: string;
}

export interface DemoAppStatus {
  deployed: boolean;
  outputs?: DemoAppOutputs;
  deployedAt?: string;
}

export interface ProgressEvent {
  step: string;
  message: string;
  progress: number;
  error?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

export interface TerraformOutputs {
  api_endpoint: string;
  graphql_endpoint: string;
  lambda_function_name: string;
  lambda_function_arn: string;
  aws_region: string;
}

export interface SavedCredentials {
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  fastly?: {
    apiToken: string;
  };
  demoApp?: {
    graphqlEndpoint: string;
    lambdaFunctionName: string;
    awsRegion: string;
    deployedAt: string;
  };
  savedAt: string;
}

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}
