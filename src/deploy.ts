/**
 * Main deployment orchestration for demo app
 */

import fs from 'fs';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { terraformInit, terraformApply, getTerraformOutputs } from './terraform/index.js';
import { saveDemoAppOutputs } from './credentials/index.js';
import { LAMBDA_ZIP_PATH } from './config.js';
import type { DemoAppAwsConfig, DemoAppConfig, DemoAppOutputs, ProgressCallback } from './types.js';

/**
 * Verify AWS credentials are valid
 */
async function verifyAwsCredentials(awsConfig: DemoAppAwsConfig): Promise<boolean> {
  try {
    const stsClient = awsConfig.useEnv
      ? new STSClient({
          region: awsConfig.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
        })
      : new STSClient({
          region: awsConfig.region,
          credentials: {
            accessKeyId: awsConfig.accessKeyId!,
            secretAccessKey: awsConfig.secretAccessKey!,
          },
        });

    await stsClient.send(new GetCallerIdentityCommand({}));
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that the pre-built Lambda zip exists.
 */
function ensureLambdaZipExists(): string {
  if (!fs.existsSync(LAMBDA_ZIP_PATH)) {
    throw new Error(
      `Lambda zip not found at ${LAMBDA_ZIP_PATH}. ` +
      `The pre-built lambda-function.zip must be included in the package. ` +
      `Build it with: cd lambda-src && npm run build`
    );
  }
  return LAMBDA_ZIP_PATH;
}

/**
 * Deploy the demo app to AWS
 */
export async function deployDemoApp(
  config: DemoAppConfig,
  onProgress?: ProgressCallback
): Promise<DemoAppOutputs> {
  const progress = onProgress || (() => {});

  try {
    // Step 1: Verify AWS credentials
    progress({ step: 'credentials', message: 'Verifying AWS credentials...', progress: 10 });
    const credentialsValid = await verifyAwsCredentials(config.aws);
    if (!credentialsValid) {
      throw new Error('Invalid AWS credentials');
    }

    // Step 2: Verify Lambda zip exists
    progress({ step: 'check-lambda', message: 'Verifying Lambda package...', progress: 20 });
    ensureLambdaZipExists();

    // Step 3: Initialize Terraform
    progress({ step: 'terraform-init', message: 'Initializing Terraform...', progress: 30 });
    await terraformInit();

    // Step 4: Apply Terraform (creates Lambda, API Gateway)
    progress({ step: 'terraform-apply', message: 'Creating AWS resources (this may take a few minutes)...', progress: 40 });
    await terraformApply(config.aws);

    // Step 5: Get Terraform outputs
    progress({ step: 'outputs', message: 'Retrieving deployment info...', progress: 80 });
    const tfOutputs = await getTerraformOutputs();

    // Step 6: Save outputs to deployment-config.json
    progress({ step: 'save', message: 'Saving deployment info...', progress: 90 });
    const outputs: DemoAppOutputs = {
      graphqlEndpoint: tfOutputs.graphql_endpoint,
      lambdaFunctionName: tfOutputs.lambda_function_name,
      awsRegion: tfOutputs.aws_region,
    };
    saveDemoAppOutputs(outputs);

    progress({ step: 'done', message: 'Deployment complete!', progress: 100 });

    return outputs;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    progress({ step: 'error', message: errorMessage, progress: 0, error: errorMessage });
    throw error;
  }
}
