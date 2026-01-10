/**
 * Terraform operations for demo app deployment
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  TERRAFORM_DIR,
  DEMO_APP_TFSTATE_PATH,
  ORION_CONFIG_DIR,
  LAMBDA_ZIP_PATH,
} from '../config.js';
import type { CommandResult, TerraformOutputs, DemoAppAwsConfig } from '../types.js';

/**
 * Execute a command and return the result
 */
function executeCommand(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    verbose?: boolean;
  } = {}
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      if (options.verbose) {
        process.stdout.write(data);
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      if (options.verbose) {
        process.stderr.write(data);
      }
    });

    proc.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * Ensure the Orion config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(ORION_CONFIG_DIR)) {
    fs.mkdirSync(ORION_CONFIG_DIR, { recursive: true });
  }
}

/**
 * Get Terraform environment variables for AWS credentials
 */
function getTerraformEnv(awsConfig: DemoAppAwsConfig): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};

  if (awsConfig.useEnv) {
    // Use existing environment variables
    env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    env.AWS_REGION = awsConfig.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  } else {
    // Use provided credentials
    env.AWS_ACCESS_KEY_ID = awsConfig.accessKeyId;
    env.AWS_SECRET_ACCESS_KEY = awsConfig.secretAccessKey;
    env.AWS_REGION = awsConfig.region;
  }

  return env;
}

/**
 * Initialize Terraform
 */
export async function terraformInit(): Promise<void> {
  ensureConfigDir();

  const result = await executeCommand(
    'terraform',
    ['init', '-no-color'],
    { cwd: TERRAFORM_DIR }
  );

  if (result.code !== 0) {
    throw new Error(`Terraform init failed: ${result.stderr}`);
  }
}

/**
 * Apply Terraform configuration
 */
export async function terraformApply(awsConfig: DemoAppAwsConfig): Promise<void> {
  ensureConfigDir();

  // Verify lambda zip exists
  if (!fs.existsSync(LAMBDA_ZIP_PATH)) {
    throw new Error(`Lambda ZIP not found at ${LAMBDA_ZIP_PATH}`);
  }

  const env = getTerraformEnv(awsConfig);
  const stateArg = `-state=${DEMO_APP_TFSTATE_PATH}`;
  const regionVar = `-var=aws_region=${awsConfig.region}`;

  const result = await executeCommand(
    'terraform',
    ['apply', '-auto-approve', '-no-color', stateArg, regionVar],
    {
      cwd: TERRAFORM_DIR,
      env,
      verbose: false,
    }
  );

  if (result.code !== 0) {
    throw new Error(`Terraform apply failed: ${result.stderr}`);
  }
}

/**
 * Destroy Terraform resources
 */
export async function terraformDestroy(awsConfig: DemoAppAwsConfig): Promise<void> {
  if (!fs.existsSync(DEMO_APP_TFSTATE_PATH)) {
    return; // Nothing to destroy
  }

  // Initialize Terraform first to ensure providers are available
  await terraformInit();

  const env = getTerraformEnv(awsConfig);
  const stateArg = `-state=${DEMO_APP_TFSTATE_PATH}`;
  const regionVar = `-var=aws_region=${awsConfig.region}`;

  const result = await executeCommand(
    'terraform',
    ['destroy', '-auto-approve', '-no-color', stateArg, regionVar],
    {
      cwd: TERRAFORM_DIR,
      env,
      verbose: false,
    }
  );

  if (result.code !== 0) {
    throw new Error(`Terraform destroy failed: ${result.stderr}`);
  }

  // Remove state file after successful destroy
  if (fs.existsSync(DEMO_APP_TFSTATE_PATH)) {
    fs.unlinkSync(DEMO_APP_TFSTATE_PATH);
  }
  
  // Remove backup state file if it exists
  const backupPath = `${DEMO_APP_TFSTATE_PATH}.backup`;
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
  }
}

/**
 * Get Terraform outputs
 */
export async function getTerraformOutputs(): Promise<TerraformOutputs> {
  if (!fs.existsSync(DEMO_APP_TFSTATE_PATH)) {
    throw new Error('Terraform state not found. Deploy the demo app first.');
  }

  const stateArg = `-state=${DEMO_APP_TFSTATE_PATH}`;

  const result = await executeCommand(
    'terraform',
    ['output', '-json', stateArg],
    { cwd: TERRAFORM_DIR }
  );

  if (result.code !== 0) {
    throw new Error(`Failed to get Terraform outputs: ${result.stderr}`);
  }

  const outputs = JSON.parse(result.stdout);
  const simplified: Record<string, string> = {};

  for (const [key, value] of Object.entries(outputs)) {
    simplified[key] = (value as { value: string }).value;
  }

  return simplified as unknown as TerraformOutputs;
}

/**
 * Check if demo app Terraform state exists
 */
export function checkTfStateExists(): boolean {
  return fs.existsSync(DEMO_APP_TFSTATE_PATH);
}
