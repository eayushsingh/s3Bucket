import { S3Client } from "@aws-sdk/client-s3";
import { loadStorageConfig } from "./storage.config";

let cachedS3Client: S3Client | null = null;

/**
 * Creates or retrieves the singleton S3/MinIO client instance.
 */
export function getS3Client(): S3Client {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const config = loadStorageConfig();

  cachedS3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle, // Required for MinIO path-style bucket routing (e.g. http://minio:9000/bucket)
    tls: config.useSSL,
  });

  return cachedS3Client;
}

/**
 * For testing or reconfiguration purposes, allows resetting the cached client.
 */
export function resetS3Client(): void {
  cachedS3Client = null;
}
