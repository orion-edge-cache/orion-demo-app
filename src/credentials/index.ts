/**
 * Deployment config storage operations
 */

import fs from 'fs';
import { DEPLOYMENT_CONFIG_PATH, ORION_CONFIG_DIR } from '../config.js';
import type { SavedCredentials, DemoAppOutputs } from '../types.js';

/**
 * Read saved deployment config from file
 */
export function readDeploymentConfig(): SavedCredentials | null {
  try {
    if (!fs.existsSync(DEPLOYMENT_CONFIG_PATH)) {
      return null;
    }
    const content = fs.readFileSync(DEPLOYMENT_CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Write deployment config to file
 */
function writeDeploymentConfig(config: SavedCredentials): void {
  // Ensure config directory exists
  if (!fs.existsSync(ORION_CONFIG_DIR)) {
    fs.mkdirSync(ORION_CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(
    DEPLOYMENT_CONFIG_PATH,
    JSON.stringify(config, null, 2),
    { mode: 0o600 }
  );
}

/**
 * Save demo app outputs to deployment config file
 */
export function saveDemoAppOutputs(outputs: DemoAppOutputs): void {
  const existing = readDeploymentConfig() || { savedAt: new Date().toISOString() };

  existing.demoApp = {
    graphqlEndpoint: outputs.graphqlEndpoint,
    s3WebsiteUrl: outputs.s3WebsiteUrl,
    lambdaFunctionName: outputs.lambdaFunctionName,
    clientBucket: outputs.clientBucket,
    awsRegion: outputs.awsRegion,
    cloudfrontUrl: outputs.cloudfrontUrl,
    cloudfrontDistributionId: outputs.cloudfrontDistributionId,
    deployedAt: new Date().toISOString(),
  };

  existing.savedAt = new Date().toISOString();

  writeDeploymentConfig(existing);
}

/**
 * Remove demo app outputs from deployment config file
 */
export function removeDemoAppOutputs(): void {
  const existing = readDeploymentConfig();
  if (!existing) return;

  delete existing.demoApp;
  existing.savedAt = new Date().toISOString();

  writeDeploymentConfig(existing);
}

/**
 * Get saved demo app outputs
 */
export function getDemoAppOutputs(): DemoAppOutputs | null {
  const config = readDeploymentConfig();
  if (!config?.demoApp) return null;

  return {
    graphqlEndpoint: config.demoApp.graphqlEndpoint,
    s3WebsiteUrl: config.demoApp.s3WebsiteUrl,
    lambdaFunctionName: config.demoApp.lambdaFunctionName,
    clientBucket: config.demoApp.clientBucket,
    awsRegion: config.demoApp.awsRegion,
    cloudfrontUrl: config.demoApp.cloudfrontUrl,
    cloudfrontDistributionId: config.demoApp.cloudfrontDistributionId,
  };
}

/**
 * Get demo app deployment timestamp
 */
export function getDemoAppDeployedAt(): string | null {
  const config = readDeploymentConfig();
  return config?.demoApp?.deployedAt || null;
}
