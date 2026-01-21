/**
 * Configuration and paths for @orion/demo-app-deploy
 */

import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Package root (where assets/ and terraform/ are located)
// In development: src/ -> package root
// In production (dist/): dist/ -> package root
export const PACKAGE_ROOT = path.resolve(__dirname, '..');

// Assets paths
export const ASSETS_DIR = path.join(PACKAGE_ROOT, 'assets');
export const LAMBDA_ZIP_PATH = path.join(ASSETS_DIR, 'lambda-function.zip');

// Lambda source paths
export const LAMBDA_SRC_DIR = path.join(PACKAGE_ROOT, 'lambda-src');

// Terraform paths
export const TERRAFORM_DIR = path.join(PACKAGE_ROOT, 'terraform');

// User config paths (shared with orion-cli and orion-console)
export const ORION_CONFIG_DIR = path.join(os.homedir(), '.config', 'orion');
export const DEPLOYMENT_CONFIG_PATH = path.join(ORION_CONFIG_DIR, 'deployment-config.json');
export const DEMO_APP_TFSTATE_PATH = path.join(ORION_CONFIG_DIR, 'demo-app.tfstate');

