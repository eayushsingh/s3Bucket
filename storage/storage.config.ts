import { z } from "zod";
import { StorageConfig } from "./storage.types";

const StorageConfigSchema = z.object({
  endpoint: z.string().url().default("http://127.0.0.1:9000"),
  publicEndpoint: z.string().url().optional(),
  region: z.string().default("us-east-1"),
  accessKeyId: z.string().min(1, "Storage access key is required"),
  secretAccessKey: z.string().min(1, "Storage secret key is required"),
  useSSL: z.boolean().default(false),
  forcePathStyle: z.boolean().default(true),
  defaultBuckets: z.array(z.string()).default([
    "app-uploads",
    "app-images",
    "app-documents",
    "app-public",
    "app-private",
    "app-backups",
  ]),
  presignedUploadExpirySeconds: z.number().int().positive().default(900), // 15 mins
  presignedDownloadExpirySeconds: z.number().int().positive().default(3600), // 1 hr
  maxFileSizeBytes: z.number().int().positive().default(5 * 1024 * 1024 * 1024), // 5 GB
});

export function loadStorageConfig(): StorageConfig {
  const endpoint = process.env.STORAGE_ENDPOINT || "http://127.0.0.1:9000";
  const publicEndpoint = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT || endpoint;
  const region = process.env.STORAGE_REGION || "us-east-1";
  const accessKeyId = process.env.STORAGE_ACCESS_KEY || "minioadmin";
  const secretAccessKey = process.env.STORAGE_SECRET_KEY || "minioadmin_secure_password_123";
  const useSSL = process.env.STORAGE_USE_SSL === "true";
  const forcePathStyle = process.env.STORAGE_FORCE_PATH_STYLE !== "false"; // default true for MinIO

  const rawBuckets = process.env.STORAGE_DEFAULT_BUCKETS || "app-uploads,app-images,app-documents,app-public,app-private,app-backups";
  const defaultBuckets = rawBuckets
    .split(",")
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const presignedUploadExpirySeconds = parseInt(
    process.env.STORAGE_PRESIGNED_UPLOAD_EXPIRY || "900",
    10
  );
  const presignedDownloadExpirySeconds = parseInt(
    process.env.STORAGE_PRESIGNED_DOWNLOAD_EXPIRY || "3600",
    10
  );
  const maxFileSizeBytes = parseInt(
    process.env.STORAGE_MAX_FILE_SIZE_BYTES || String(5 * 1024 * 1024 * 1024),
    10
  );

  const parsed = StorageConfigSchema.parse({
    endpoint,
    publicEndpoint,
    region,
    accessKeyId,
    secretAccessKey,
    useSSL,
    forcePathStyle,
    defaultBuckets,
    presignedUploadExpirySeconds,
    presignedDownloadExpirySeconds,
    maxFileSizeBytes,
  });

  return parsed;
}

export const storageConfig = loadStorageConfig();
