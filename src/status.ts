/**
 * Status checking for demo app deployment
 */

import { checkTfStateExists, getTerraformOutputs } from './terraform/index.js';
import { getDemoAppOutputs, getDemoAppDeployedAt } from './credentials/index.js';
import type { DemoAppStatus, DemoAppOutputs } from './types.js';

/**
 * Check if demo app is deployed
 */
export function checkDemoAppDeployed(): boolean {
  return checkTfStateExists();
}

/**
 * Get full demo app status
 */
export async function getDemoAppStatus(): Promise<DemoAppStatus> {
  const deployed = checkTfStateExists();

  if (!deployed) {
    return { deployed: false };
  }

  // Try to get outputs from credentials first (faster)
  let outputs = getDemoAppOutputs();
  const deployedAt = getDemoAppDeployedAt();

  // If not in credentials, try to get from Terraform state
  if (!outputs) {
    try {
      const tfOutputs = await getTerraformOutputs();
      outputs = {
        graphqlEndpoint: tfOutputs.graphql_endpoint,
        s3WebsiteUrl: tfOutputs.s3_website_url,
        lambdaFunctionName: tfOutputs.lambda_function_name,
        clientBucket: tfOutputs.client_bucket,
        awsRegion: tfOutputs.aws_region,
        cloudfrontUrl: tfOutputs.cloudfront_url,
        cloudfrontDistributionId: tfOutputs.cloudfront_distribution_id,
      };
    } catch {
      // State might be corrupted
      return { deployed: true };
    }
  }

  return {
    deployed: true,
    outputs: outputs || undefined,
    deployedAt: deployedAt || undefined,
  };
}
