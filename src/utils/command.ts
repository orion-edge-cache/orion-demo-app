/**
 * Shared command execution utility
 */

import { spawn } from 'child_process';
import type { CommandResult } from '../types.js';

export interface ExecuteCommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  verbose?: boolean;
}

/**
 * Execute a command and return the result
 *
 * @param command - The command to execute
 * @param args - Command arguments
 * @param options - Execution options
 */
export function executeCommand(
  command: string,
  args: string[],
  options: ExecuteCommandOptions = {}
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
