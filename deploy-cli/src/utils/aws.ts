import { executeCommand } from './shell.js';
import { readFileSync } from 'fs';

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(
  bucket: string,
  key: string,
  filePath: string
): Promise<void> {
  const result = await executeCommand(
    `aws s3 cp "${filePath}" "s3://${bucket}/${key}"`,
    { verbose: false }
  );

  if (result.code !== 0) {
    throw new Error(`Failed to upload ${filePath} to S3: ${result.stderr}`);
  }
}

/**
 * Upload a directory to S3 (sync)
 */
export async function uploadDirectoryToS3(
  bucket: string,
  localDir: string,
  s3Prefix = ''
): Promise<void> {
  const s3Path = s3Prefix ? `s3://${bucket}/${s3Prefix}` : `s3://${bucket}/`;
  
  const result = await executeCommand(
    `aws s3 sync "${localDir}" "${s3Path}" --delete`,
    { verbose: true }
  );

  if (result.code !== 0) {
    throw new Error(`Failed to sync ${localDir} to S3: ${result.stderr}`);
  }
}

/**
 * Empty an S3 bucket (remove all objects)
 */
export async function emptyS3Bucket(bucket: string): Promise<void> {
  const result = await executeCommand(
    `aws s3 rm "s3://${bucket}" --recursive`,
    { verbose: false }
  );

  if (result.code !== 0) {
    // Bucket might already be empty, which is fine
    if (!result.stderr.includes('does not exist')) {
      console.warn(`Warning: ${result.stderr}`);
    }
  }
}

/**
 * Check if AWS CLI is configured
 */
export async function checkAWSCredentials(): Promise<boolean> {
  const result = await executeCommand('aws sts get-caller-identity', {
    verbose: false,
  });

  return result.code === 0;
}

/**
 * Get AWS account ID
 */
export async function getAWSAccountId(): Promise<string> {
  const result = await executeCommand(
    'aws sts get-caller-identity --query Account --output text',
    { verbose: false }
  );

  if (result.code !== 0) {
    throw new Error('Failed to get AWS account ID');
  }

  return result.stdout.trim();
}
