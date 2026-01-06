import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

// S3 client instance (lazy initialization)
let s3Client: S3Client | null = null;

// Environment check
const isS3Enabled = (): boolean => {
  const deploymentEnv = process.env.DEPLOYMENT_ENV || process.env.NODE_ENV;
  return deploymentEnv === 'aws-lambda' || deploymentEnv === 'production';
};

// Get the appropriate db.json path based on environment
export const getDBPath = (): string => {
  if (isS3Enabled()) {
    return '/tmp/db.json';
  }
  // Localhost: relative to this file's location
  return path.join(__dirname, 'json/db.json');
};

// Initialize S3 client
const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  return s3Client;
};

// Download db.json from S3 to /tmp
const downloadFromS3 = async (): Promise<void> => {
  const bucketName = process.env.S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }

  console.log(`Downloading db.json from S3 bucket: ${bucketName}`);

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: 'db.json',
  });

  try {
    const response = await client.send(command);
    
    if (!response.Body) {
      throw new Error('S3 response body is empty');
    }

    // Convert stream to string
    const bodyString = await response.Body.transformToString();
    
    // Write to /tmp
    writeFileSync('/tmp/db.json', bodyString, 'utf-8');
    console.log('✓ Successfully downloaded db.json from S3');
  } catch (error) {
    console.error('Failed to download db.json from S3:', error);
    throw error;
  }
};

// Upload db.json from /tmp to S3
export const syncDBToS3 = async (): Promise<void> => {
  if (!isS3Enabled()) {
    // Not in Lambda environment, skip S3 sync
    return;
  }

  const bucketName = process.env.S3_BUCKET_NAME;
  
  if (!bucketName) {
    console.error('S3_BUCKET_NAME not set, skipping S3 sync');
    return;
  }

  const dbPath = '/tmp/db.json';
  
  if (!existsSync(dbPath)) {
    console.error('db.json not found in /tmp, skipping S3 sync');
    return;
  }

  try {
    const fileContent = readFileSync(dbPath, 'utf-8');
    
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'db.json',
      Body: fileContent,
      ContentType: 'application/json',
    });

    await client.send(command);
    console.log('✓ Successfully synced db.json to S3');
  } catch (error) {
    console.error('Failed to sync db.json to S3:', error);
    // Don't throw - we don't want to fail the request if S3 sync fails
    // Data is still written to /tmp, just not persisted
  }
};

// Initialize S3 storage (download db.json if needed)
export const initializeS3Storage = async (): Promise<void> => {
  if (!isS3Enabled()) {
    console.log('Not in Lambda environment, skipping S3 initialization');
    return;
  }

  const dbPath = '/tmp/db.json';

  // Check if db.json already exists in /tmp (warm start)
  if (existsSync(dbPath)) {
    console.log('Using cached db.json from /tmp (warm start)');
    return;
  }

  // Cold start: download from S3
  console.log('Cold start: downloading db.json from S3');
  await downloadFromS3();
};

// Check if S3 manager is active
export const isS3Active = (): boolean => {
  return isS3Enabled();
};
