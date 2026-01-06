#!/usr/bin/env node
import { Command } from 'commander';
import { buildCommand } from './commands/build.js';
import { packageCommand } from './commands/package.js';
import { initCommand } from './commands/init.js';
import { applyCommand } from './commands/apply.js';
import { destroyCommand } from './commands/destroy.js';

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

program.parse();
