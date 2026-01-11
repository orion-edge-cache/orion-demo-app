/**
 * Build operations for demo app client
 */

import fs from 'fs';
import path from 'path';
import {
  CLIENT_SOURCE_DIR,
  CLIENT_BUILD_DIR,
  CLIENT_DIST_DIR,
  LAMBDA_ZIP_PATH,
} from '../config.js';
import { executeCommand } from '../utils/index.js';

/**
 * Copy directory recursively
 */
function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and dist
      if (entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Remove directory recursively
 */
function rmDirSync(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Build the client with the API Gateway URL injected
 */
export async function buildClient(apiGatewayUrl: string): Promise<string> {
  // Clean up any previous build
  rmDirSync(CLIENT_BUILD_DIR);

  // Copy client source to build directory
  if (!fs.existsSync(CLIENT_SOURCE_DIR)) {
    throw new Error(`Client source not found at ${CLIENT_SOURCE_DIR}`);
  }

  copyDirSync(CLIENT_SOURCE_DIR, CLIENT_BUILD_DIR);

  // Install dependencies
  const installResult = await executeCommand(
    'npm',
    ['install'],
    { cwd: CLIENT_BUILD_DIR }
  );

  if (installResult.code !== 0) {
    throw new Error(`Failed to install client dependencies: ${installResult.stderr}`);
  }

  // Build with injected API Gateway URL
  const buildResult = await executeCommand(
    'npm',
    ['run', 'build'],
    {
      cwd: CLIENT_BUILD_DIR,
      env: {
        VITE_API_GATEWAY_URL: apiGatewayUrl,
      },
    }
  );

  if (buildResult.code !== 0) {
    throw new Error(`Failed to build client: ${buildResult.stderr}`);
  }

  // Verify dist was created
  if (!fs.existsSync(CLIENT_DIST_DIR)) {
    throw new Error('Client build did not produce dist directory');
  }

  return CLIENT_DIST_DIR;
}

/**
 * Clean up client build directory
 */
export function cleanupClientBuild(): void {
  rmDirSync(CLIENT_BUILD_DIR);
}

/**
 * Verify that the pre-built Lambda zip exists.
 * The zip must be built locally and committed to the repo.
 *
 * To build: cd lambda-src && npm run build
 */
export function ensureLambdaZipExists(): string {
  if (!fs.existsSync(LAMBDA_ZIP_PATH)) {
    throw new Error(
      `Lambda zip not found at ${LAMBDA_ZIP_PATH}. ` +
      `The pre-built lambda-function.zip must be included in the package. ` +
      `Build it with: cd lambda-src && npm run build`
    );
  }
  return LAMBDA_ZIP_PATH;
}
