/**
 * Destroy operations for demo app
 */

import { terraformDestroy, getTerraformOutputs, checkTfStateExists } from './terraform/index.js';
import { emptyS3Bucket } from './aws/index.js';
import { removeDemoAppOutputs } from './credentials/index.js';
import { cleanupClientBuild } from './build/index.js';
import type { DemoAppConfig, ProgressCallback } from './types.js';

/**
 * Destroy the demo app AWS resources
 */
export async function destroyDemoApp(
  config: DemoAppConfig,
  onProgress?: ProgressCallback
): Promise<void> {
  const progress = onProgress || (() => {});

  try {
    // Check if there's anything to destroy
    if (!checkTfStateExists()) {
      progress({ step: 'skip', message: 'No demo app deployment found', progress: 100 });
      return;
    }

    // Step 1: Get current outputs (need bucket name to empty it)
    progress({ step: 'outputs', message: 'Getting deployment info...', progress: 10 });
    let clientBucket: string | undefined;
    try {
      const outputs = await getTerraformOutputs();
      clientBucket = outputs.client_bucket;
    } catch {
      // State might be corrupted, continue with destroy anyway
    }

    // Step 2: Empty S3 bucket (Terraform can't destroy non-empty buckets)
    if (clientBucket) {
      progress({ step: 'empty-bucket', message: 'Emptying S3 bucket...', progress: 30 });
      try {
        await emptyS3Bucket(config.aws, clientBucket);
      } catch (error) {
        // Bucket might already be empty or deleted, continue
        console.warn('Warning: Could not empty S3 bucket:', error);
      }
    }

    // Step 3: Destroy Terraform resources
    progress({ step: 'terraform-destroy', message: 'Destroying AWS resources...', progress: 50 });
    await terraformDestroy(config.aws);

    // Step 4: Remove demo app outputs from credentials
    progress({ step: 'cleanup', message: 'Cleaning up...', progress: 90 });
    removeDemoAppOutputs();
    cleanupClientBuild();

    progress({ step: 'done', message: 'Demo app destroyed', progress: 100 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    progress({ step: 'error', message: errorMessage, progress: 0, error: errorMessage });
    throw error;
  }
}
