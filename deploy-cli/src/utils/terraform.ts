import { executeCommand } from './shell.js';
import path from 'path';

const TERRAFORM_DIR = path.join(process.cwd(), 'terraform');

/**
 * Initialize Terraform
 */
export async function terraformInit(): Promise<void> {
  const result = await executeCommand('terraform init', {
    cwd: TERRAFORM_DIR,
    verbose: false,
  });

  if (result.code !== 0) {
    throw new Error(`Terraform init failed: ${result.stderr}`);
  }
}

/**
 * Validate Terraform configuration
 */
export async function terraformValidate(): Promise<void> {
  const result = await executeCommand('terraform validate', {
    cwd: TERRAFORM_DIR,
    verbose: false,
  });

  if (result.code !== 0) {
    throw new Error(`Terraform validate failed: ${result.stderr}`);
  }
}

/**
 * Run terraform plan and return the output
 */
export async function terraformPlan(): Promise<string> {
  const result = await executeCommand('terraform plan -no-color', {
    cwd: TERRAFORM_DIR,
    verbose: false,
  });

  return result.stdout + '\n' + result.stderr;
}

/**
 * Apply Terraform configuration
 */
export async function terraformApply(autoApprove = false): Promise<void> {
  const command = autoApprove
    ? 'terraform apply -auto-approve -no-color'
    : 'terraform apply -no-color';

  const result = await executeCommand(command, {
    cwd: TERRAFORM_DIR,
    verbose: true,
  });

  if (result.code !== 0) {
    throw new Error(`Terraform apply failed: ${result.stderr}`);
  }
}

/**
 * Destroy Terraform resources
 */
export async function terraformDestroy(autoApprove = false): Promise<void> {
  const command = autoApprove
    ? 'terraform destroy -auto-approve -no-color'
    : 'terraform destroy -no-color';

  const result = await executeCommand(command, {
    cwd: TERRAFORM_DIR,
    verbose: true,
  });

  if (result.code !== 0) {
    throw new Error(`Terraform destroy failed: ${result.stderr}`);
  }
}

/**
 * Get a specific output value from Terraform
 */
export async function getTerraformOutput(outputName: string): Promise<string> {
  const result = await executeCommand(`terraform output -raw ${outputName}`, {
    cwd: TERRAFORM_DIR,
    verbose: false,
  });

  if (result.code !== 0) {
    throw new Error(`Failed to get terraform output ${outputName}: ${result.stderr}`);
  }

  return result.stdout.trim();
}

/**
 * Get all Terraform outputs as a JSON object
 */
export async function getAllTerraformOutputs(): Promise<Record<string, string>> {
  const result = await executeCommand('terraform output -json', {
    cwd: TERRAFORM_DIR,
    verbose: false,
  });

  if (result.code !== 0) {
    throw new Error(`Failed to get terraform outputs: ${result.stderr}`);
  }

  const outputs = JSON.parse(result.stdout);
  const simplified: Record<string, string> = {};

  for (const [key, value] of Object.entries(outputs)) {
    simplified[key] = (value as any).value;
  }

  return simplified;
}
