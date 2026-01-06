import * as p from '@clack/prompts';
import { terraformDestroy, getAllTerraformOutputs } from '../utils/terraform.js';
import { emptyS3Bucket } from '../utils/aws.js';

export async function destroyCommand() {
  p.intro('GraphQL Deploy - Destroy Infrastructure');

  try {
    // Get current outputs (if they exist)
    let outputs: Record<string, string> = {};
    try {
      outputs = await getAllTerraformOutputs();
    } catch (error) {
      p.log.warn('No infrastructure found to destroy');
      process.exit(0);
    }

    // Show what will be destroyed
    p.note(
      [
        `Lambda Function:   ${outputs.lambda_function_name || 'N/A'}`,
        `Data Bucket:       ${outputs.data_bucket || 'N/A'}`,
        `Client Bucket:     ${outputs.client_bucket || 'N/A'}`,
        `API Gateway:       ${outputs.api_endpoint || 'N/A'}`,
      ].join('\n'),
      'Resources to be destroyed'
    );

    // Confirm destruction
    const shouldDestroy = await p.confirm({
      message: 'Are you sure you want to destroy all AWS resources?',
      initialValue: false,
    });

    if (p.isCancel(shouldDestroy) || !shouldDestroy) {
      p.cancel('Destruction cancelled');
      process.exit(0);
    }

    // Double confirmation for safety
    const confirmText = await p.text({
      message: 'Type "yes" to confirm destruction:',
      validate: (value) => {
        if (value !== 'yes') {
          return 'You must type "yes" to confirm';
        }
      },
    });

    if (p.isCancel(confirmText) || confirmText !== 'yes') {
      p.cancel('Destruction cancelled');
      process.exit(0);
    }

    const spinner = p.spinner();

    // Empty S3 buckets first (Terraform can't destroy non-empty buckets)
    if (outputs.data_bucket) {
      spinner.start(`Emptying data bucket: ${outputs.data_bucket}`);
      await emptyS3Bucket(outputs.data_bucket);
      spinner.stop('Data bucket emptied');
    }

    if (outputs.client_bucket) {
      spinner.start(`Emptying client bucket: ${outputs.client_bucket}`);
      await emptyS3Bucket(outputs.client_bucket);
      spinner.stop('Client bucket emptied');
    }

    // Run Terraform destroy
    spinner.start('Destroying infrastructure');
    await terraformDestroy(true);
    spinner.stop('Infrastructure destroyed');

    p.outro('All resources destroyed successfully');
  } catch (error: any) {
    p.log.error(error.message);
    p.outro('Destruction failed');
    process.exit(1);
  }
}
