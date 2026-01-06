import * as p from '@clack/prompts';
import { executeCommand } from '../utils/shell.js';
import path from 'path';
import { existsSync, statSync } from 'fs';

export async function packageCommand() {
  const spinner = p.spinner();

  try {
    const serverDistPath = path.join(process.cwd(), 'server', 'dist');

    // Check if server dist exists
    if (!existsSync(serverDistPath)) {
      p.log.error('Server dist/ directory not found. Run "graphql-deploy build" first.');
      process.exit(1);
    }

    // Install production dependencies in dist folder
    spinner.start('Installing production dependencies');
    const installResult = await executeCommand('npm ci --omit=dev', {
      cwd: serverDistPath,
      verbose: false,
    });

    if (installResult.code !== 0) {
      spinner.stop('Failed to install dependencies');
      p.log.error(installResult.stderr);
      process.exit(1);
    }

    spinner.stop('Dependencies installed');

    // Create ZIP file
    spinner.start('Creating Lambda package');
    const zipResult = await executeCommand(
      'zip -r ../../lambda-function.zip . -x "*.map" -x "*.d.ts"',
      {
        cwd: serverDistPath,
        verbose: false,
      }
    );

    if (zipResult.code !== 0) {
      spinner.stop('Failed to create ZIP');
      p.log.error(zipResult.stderr);
      process.exit(1);
    }

    spinner.stop('Lambda package created');

    // Get file size
    const zipPath = path.join(process.cwd(), 'lambda-function.zip');
    const stats = statSync(zipPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    p.log.success(`Package created: lambda-function.zip (${sizeMB} MB)`);
  } catch (error: any) {
    spinner.stop('Packaging failed');
    p.log.error(error.message);
    process.exit(1);
  }
}
