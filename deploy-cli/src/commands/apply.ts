import * as p from '@clack/prompts';
import { buildCommand } from './build.js';
import { packageCommand } from './package.js';
import { terraformApply, getAllTerraformOutputs } from '../utils/terraform.js';
import { uploadDirectoryToS3 } from '../utils/aws.js';
import { PROJECT_ROOT } from '../index.js';
import path from 'path';
import { existsSync } from 'fs';

export async function applyCommand() {
  p.intro('GraphQL Deploy - Deploy to AWS');

  try {
    // Confirm deployment
    const shouldDeploy = await p.confirm({
      message: 'Deploy to AWS Lambda?',
      initialValue: false,
    });

    if (p.isCancel(shouldDeploy) || !shouldDeploy) {
      p.log.warn('Deployment cancelled');
      return;
    }

    const spinner = p.spinner();

    // Step 1: Build
    p.log.step('Building application');
    await buildCommand();

    // Step 2: Package Lambda
    p.log.step('Packaging Lambda function');
    await packageCommand();

    // Step 3: Terraform Apply
    p.log.step('Deploying infrastructure');
    spinner.start('Running Terraform apply');
    await terraformApply(true);
    spinner.stop('Infrastructure deployed');

    // Step 4: Get outputs
    spinner.start('Retrieving deployment information');
    const outputs = await getAllTerraformOutputs();
    spinner.stop('Deployment information retrieved');

    // Step 5: Upload client build to S3
    p.log.step('Uploading client to S3');
    const clientDistPath = path.join(PROJECT_ROOT, 'client', 'dist');
    
    if (!existsSync(clientDistPath)) {
      p.log.error('Client dist/ not found. Build may have failed.');
      throw new Error('Client not built');
    }

    spinner.start('Uploading client files');
    await uploadDirectoryToS3(outputs.client_bucket, clientDistPath);
    spinner.stop('Client files uploaded');

    // Display deployment summary
    p.note(
      [
        `GraphQL Endpoint:  ${outputs.graphql_endpoint}`,
        `React App URL:     ${outputs.s3_website_url}`,
        `Client Bucket:     ${outputs.client_bucket}`,
        `Lambda Function:   ${outputs.lambda_function_name}`,
        `AWS Region:        ${outputs.aws_region}`,
      ].join('\n'),
      'Deployment Summary'
    );

    p.log.success('Deployment complete! 🚀');
    
    // Show next steps
    console.log('\nNext steps:');
    console.log(`  1. Test GraphQL: curl -X POST ${outputs.graphql_endpoint} -H "Content-Type: application/json" -d '{"query":"{users{id name}}"}'`);
    console.log(`  2. Open React app: ${outputs.s3_website_url}`);
  } catch (error: any) {
    p.log.error(error.message);
    throw error;
  }
}
