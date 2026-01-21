/**
 * Main deployment orchestration for demo app
 */

import { terraformInit, terraformApply, getTerraformOutputs } from './terraform/index.js';
import { buildClient, cleanupClientBuild, ensureLambdaZipExists } from './build/index.js';
import { uploadDirectoryToS3, verifyAwsCredentials } from './aws/index.js';
import { saveDemoAppOutputs } from './credentials/index.js';
import type { DemoAppConfig, DemoAppOutputs, ProgressCallback } from './types.js';

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
    progress({ step: 'credentials', message: 'Verifying AWS credentials...', progress: 5 });
    const credentialsValid = await verifyAwsCredentials(config.aws);
    if (!credentialsValid) {
      throw new Error('Invalid AWS credentials');
    }

    // Step 2: Verify Lambda zip exists
    progress({ step: 'check-lambda', message: 'Verifying Lambda package...', progress: 10 });
    ensureLambdaZipExists();

    // Step 3: Initialize Terraform
    progress({ step: 'terraform-init', message: 'Initializing Terraform...', progress: 15 });
    await terraformInit();

    // Step 4: Apply Terraform (creates Lambda, API Gateway, S3 bucket)
    progress({ step: 'terraform-apply', message: 'Creating AWS resources (this may take a few minutes)...', progress: 20 });
    await terraformApply(config.aws);

    // Step 5: Get Terraform outputs
    progress({ step: 'outputs', message: 'Retrieving deployment info...', progress: 50 });
    const tfOutputs = await getTerraformOutputs();

    // Step 6: Build client with API Gateway URL
    progress({ step: 'build-client', message: 'Building React client...', progress: 60 });
    const clientDistDir = await buildClient(tfOutputs.api_endpoint);

    // Step 7: Upload client to S3
    progress({ step: 'upload', message: 'Uploading client to S3...', progress: 80 });
    await uploadDirectoryToS3(config.aws, tfOutputs.client_bucket, clientDistDir);

    // Step 8: Clean up build directory
    progress({ step: 'cleanup', message: 'Cleaning up...', progress: 90 });
    cleanupClientBuild();

    // Step 9: Save outputs to deployment-config.json
    progress({ step: 'save', message: 'Saving deployment info...', progress: 95 });
    const outputs: DemoAppOutputs = {
      graphqlEndpoint: tfOutputs.graphql_endpoint,
      s3WebsiteUrl: tfOutputs.s3_website_url,
      lambdaFunctionName: tfOutputs.lambda_function_name,
      clientBucket: tfOutputs.client_bucket,
      awsRegion: tfOutputs.aws_region,
      cloudfrontUrl: tfOutputs.cloudfront_url,
      cloudfrontDistributionId: tfOutputs.cloudfront_distribution_id,
    };
    saveDemoAppOutputs(outputs);

    progress({ step: 'done', message: 'Deployment complete!', progress: 100 });

    return outputs;
  } catch (error) {
    // Clean up on error
    cleanupClientBuild();
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    progress({ step: 'error', message: errorMessage, progress: 0, error: errorMessage });
    throw error;
  }
}
