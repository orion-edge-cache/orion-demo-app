#!/usr/bin/env node
import { Command } from 'commander';
import * as p from '@clack/prompts';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCommand } from './commands/build.js';
import { packageCommand } from './commands/package.js';
import { initCommand } from './commands/init.js';
import { applyCommand } from './commands/apply.js';
import { destroyCommand } from './commands/destroy.js';

// Get the project root directory (orion-demo-app)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

const program = new Command();

program
  .name('graphql-deploy')
  .description('Deploy GraphQL app to AWS Lambda')
  .version('1.0.0');

program
  .command('build')
  .description('Build server and client')
  .action(async () => {
    try {
      await buildCommand();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('package')
  .description('Package Lambda function')
  .action(async () => {
    try {
      await packageCommand();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize Terraform and check prerequisites')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('apply')
  .description('Deploy to AWS (build + package + terraform apply)')
  .action(async () => {
    try {
      await applyCommand();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('destroy')
  .description('Destroy all AWS resources')
  .action(async () => {
    try {
      await destroyCommand();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

// Check if a command or flag was provided
const hasCommandOrFlag = process.argv.length > 2;

if (hasCommandOrFlag) {
  // Use Commander.js for explicit commands and flags (--help, --version, etc.)
  program.parse();
} else {
  // Show interactive menu when no arguments provided
  runInteractiveMode();
}

async function runInteractiveMode() {
  while (true) {
    p.intro('GraphQL Deploy - AWS Lambda Deployment Tool');

    const command = await p.select({
      message: 'What would you like to do?',
      options: [
        {
          value: 'init',
          label: 'Initialize',
          hint: 'Check prerequisites and setup Terraform',
        },
        {
          value: 'build',
          label: 'Build',
          hint: 'Build server and client applications',
        },
        {
          value: 'package',
          label: 'Package',
          hint: 'Create Lambda deployment ZIP',
        },
        {
          value: 'apply',
          label: 'Deploy',
          hint: 'Full deployment to AWS (build + package + terraform)',
        },
        {
          value: 'destroy',
          label: 'Destroy',
          hint: 'Remove all AWS resources',
        },
        {
          value: 'exit',
          label: 'Exit',
          hint: 'Exit the CLI',
        },
      ],
    });

    if (p.isCancel(command) || command === 'exit') {
      p.outro('Goodbye!');
      process.exit(0);
    }

    try {
      switch (command) {
        case 'init':
          await initCommand();
          break;
        case 'build':
          await buildCommand();
          break;
        case 'package':
          await packageCommand();
          break;
        case 'apply':
          await applyCommand();
          break;
        case 'destroy':
          await destroyCommand();
          break;
      }
    } catch (error: any) {
      p.log.error(error.message || 'An error occurred');
    }

    // Add a small pause before showing menu again
    console.log('');
  }
}
