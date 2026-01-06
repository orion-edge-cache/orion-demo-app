import * as p from '@clack/prompts';
import { terraformInit, terraformValidate } from '../utils/terraform.js';
import { checkAWSCredentials } from '../utils/aws.js';
import { commandExists } from '../utils/shell.js';

export async function initCommand() {
  p.intro('GraphQL Deploy - Initialization');

  const spinner = p.spinner();

  try {
    // Check prerequisites
    spinner.start('Checking prerequisites');

    // Check Terraform
    const hasTerraform = await commandExists('terraform');
    if (!hasTerraform) {
      spinner.stop('Terraform not found');
      p.log.error('Terraform is not installed. Install from: https://developer.hashicorp.com/terraform/install');
      process.exit(1);
    }

    // Check AWS CLI
    const hasAWSCLI = await commandExists('aws');
    if (!hasAWSCLI) {
      spinner.stop('AWS CLI not found');
      p.log.error('AWS CLI is not installed. Install from: https://aws.amazon.com/cli/');
      process.exit(1);
    }

    // Check AWS credentials
    const hasCredentials = await checkAWSCredentials();
    if (!hasCredentials) {
      spinner.stop('AWS credentials not configured');
      p.log.error('AWS credentials not found. Run: aws configure');
      process.exit(1);
    }

    spinner.stop('Prerequisites check passed');

    // Initialize Terraform
    spinner.start('Initializing Terraform');
    await terraformInit();
    spinner.stop('Terraform initialized');

    // Validate configuration
    spinner.start('Validating Terraform configuration');
    await terraformValidate();
    spinner.stop('Configuration validated');

    p.outro('Initialization complete! You can now run: graphql-deploy apply');
  } catch (error: any) {
    spinner.stop('Initialization failed');
    p.log.error(error.message);
    process.exit(1);
  }
}
