import * as p from '@clack/prompts';
import { executeCommand } from '../utils/shell.js';
import { getTerraformOutput } from '../utils/terraform.js';
import { PROJECT_ROOT } from '../index.js';
import path from 'path';

export async function buildCommand() {
  const spinner = p.spinner();

  try {
    // Build server
    spinner.start('Building server');
    const serverDir = path.join(PROJECT_ROOT, 'server');
    const serverResult = await executeCommand('npm run build', {
      cwd: serverDir,
      verbose: false,
    });

    if (serverResult.code !== 0) {
      spinner.stop('Server build failed');
      p.log.error(`Build failed in ${serverDir}`);
      p.log.error(serverResult.stderr || serverResult.stdout);
      throw new Error('Server build failed');
    }

    spinner.stop('Server built successfully');

    // Try to get API Gateway URL (if Terraform has been applied)
    let apiGatewayUrl = '';
    try {
      apiGatewayUrl = await getTerraformOutput('api_endpoint');
      p.log.info(`API Gateway URL: ${apiGatewayUrl}`);
    } catch (error) {
      p.log.warn('Could not retrieve API Gateway URL (Terraform not applied yet)');
    }

    // Build client with injected API Gateway URL
    spinner.start('Building client');
    const clientDir = path.join(PROJECT_ROOT, 'client');
    const env = apiGatewayUrl
      ? { ...process.env, VITE_API_GATEWAY_URL: apiGatewayUrl }
      : process.env;

    const clientResult = await executeCommand('npm run build', {
      cwd: clientDir,
      verbose: false,
      env,
    });

    if (clientResult.code !== 0) {
      spinner.stop('Client build failed');
      p.log.error(`Build failed in ${clientDir}`);
      p.log.error(clientResult.stderr || clientResult.stdout);
      throw new Error('Client build failed');
    }

    spinner.stop('Client built successfully');

    p.log.success('Build complete!');
    if (apiGatewayUrl) {
      p.note(`API Gateway URL was injected into client build`, 'Info');
    }
  } catch (error: any) {
    spinner.stop('Build failed');
    throw error;
  }
}
