/**
 * AWS operations for demo app deployment
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import type { DemoAppAwsConfig } from '../types.js';

/**
 * Get S3 client with credentials
 */
function getS3Client(awsConfig: DemoAppAwsConfig): S3Client {
  if (awsConfig.useEnv) {
    return new S3Client({
      region: awsConfig.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
    });
  }

  return new S3Client({
    region: awsConfig.region,
    credentials: {
      accessKeyId: awsConfig.accessKeyId!,
      secretAccessKey: awsConfig.secretAccessKey!,
    },
  });
}

/**
 * Verify AWS credentials are valid
 */
export async function verifyAwsCredentials(awsConfig: DemoAppAwsConfig): Promise<boolean> {
  try {
    const stsClient = awsConfig.useEnv
      ? new STSClient({
          region: awsConfig.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
        })
      : new STSClient({
          region: awsConfig.region,
          credentials: {
            accessKeyId: awsConfig.accessKeyId!,
            secretAccessKey: awsConfig.secretAccessKey!,
          },
        });

    await stsClient.send(new GetCallerIdentityCommand({}));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all files in a directory recursively
 */
function getAllFiles(dir: string, baseDir: string = dir): { filePath: string; key: string }[] {
  const files: { filePath: string; key: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      const key = path.relative(baseDir, fullPath);
      files.push({ filePath: fullPath, key });
    }
  }

  return files;
}

/**
 * Upload a directory to S3
 */
export async function uploadDirectoryToS3(
  awsConfig: DemoAppAwsConfig,
  bucket: string,
  localDir: string
): Promise<void> {
  const s3Client = getS3Client(awsConfig);
  const files = getAllFiles(localDir);

  for (const { filePath, key } of files) {
    const content = fs.readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
      })
    );
  }
}

/**
 * Empty an S3 bucket (delete all objects)
 */
export async function emptyS3Bucket(
  awsConfig: DemoAppAwsConfig,
  bucket: string
): Promise<void> {
  const s3Client = getS3Client(awsConfig);

  // List all objects
  let continuationToken: string | undefined;
  
  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    );

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      // Delete objects in batches
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
          },
        })
      );
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);
}
