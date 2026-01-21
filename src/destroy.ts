/**
 * Destroy operations for demo app
 */

import { terraformDestroy, checkTfStateExists } from './terraform/index.js';
import { removeDemoAppOutputs } from './credentials/index.js';
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

    // Step 1: Destroy Terraform resources
    progress({ step: 'terraform-destroy', message: 'Destroying AWS resources...', progress: 30 });
    await terraformDestroy(config.aws);

    // Step 2: Remove demo app outputs from credentials
    progress({ step: 'cleanup', message: 'Cleaning up...', progress: 90 });
    removeDemoAppOutputs();

    progress({ step: 'done', message: 'Demo app destroyed', progress: 100 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    progress({ step: 'error', message: errorMessage, progress: 0, error: errorMessage });
    throw error;
  }
}
