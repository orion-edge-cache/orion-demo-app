import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ShellResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface ShellOptions {
  cwd?: string;
  verbose?: boolean;
  env?: NodeJS.ProcessEnv;
}

/**
 * Execute a shell command and return the result
 */
export async function executeCommand(
  command: string,
  options: ShellOptions = {}
): Promise<ShellResult> {
  const { cwd, verbose = false, env } = options;

  if (verbose) {
    console.log(`\n$ ${command}`);
    if (cwd) console.log(`  (in ${cwd})`);
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      env: env || process.env,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (verbose && stdout) {
      console.log(stdout);
    }

    if (verbose && stderr) {
      console.error(stderr);
    }

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      code: 0,
    };
  } catch (error: any) {
    if (verbose) {
      if (error.stdout) console.log(error.stdout);
      if (error.stderr) console.error(error.stderr);
    }

    return {
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message || '',
      code: error.code || 1,
    };
  }
}

/**
 * Check if a command exists
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}
