/**
 * Storage types and interfaces for S3 / MinIO compatible storage layer.
 */

export type S3StorageClass =
  | "STANDARD"
  | "REDUCED_REDUNDANCY"
  | "STANDARD_IA"
  | "ONEZONE_IA"
  | "INTELLIGENT_TIERING"
  | "GLACIER"
  | "DEEP_ARCHIVE"
  | "OUTPOSTS"
  | "GLACIER_IR"
  | "SNOW"
  | "EXPRESS_ONEZONE";

export type ServerSideEncryptionType = "AES256" | "aws:kms";

export interface StorageConfig {
  endpoint: string;
  publicEndpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  useSSL: boolean;
  forcePathStyle: boolean;
  defaultBuckets: string[];
  presignedUploadExpirySeconds: number;
  presignedDownloadExpirySeconds: number;
  maxFileSizeBytes: number;
}

export interface BucketInfo {
  name: string;
  creationDate?: Date;
  isDefault?: boolean;
  versioning?: "Enabled" | "Suspended" | "Disabled";
}

export interface ObjectMetadata {
  key: string;
  size: number;
  lastModified?: Date;
  etag?: string;
  contentType?: string;
  storageClass?: S3StorageClass | string;
  serverSideEncryption?: ServerSideEncryptionType | string;
  versionId?: string;
  metadata?: Record<string, string>;
}

export interface ListObjectsOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListObjectsResult {
  objects: ObjectMetadata[];
  prefixes: string[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export interface UploadPresignedUrlOptions {
  bucket: string;
  objectKey: string;
  contentType?: string;
  storageClass?: S3StorageClass;
  serverSideEncryption?: ServerSideEncryptionType;
  expiresInSeconds?: number;
  maxFileSizeBytes?: number;
  metadata?: Record<string, string>;
}

export interface DownloadPresignedUrlOptions {
  bucket: string;
  objectKey: string;
  expiresInSeconds?: number;
  responseDisposition?: string;
  responseContentType?: string;
}

export interface PresignedUrlResult {
  url: string;
  objectKey: string;
  bucket: string;
  expiresInSeconds: number;
  expiresAt: string;
  headers?: Record<string, string>;
}

export interface MultipartPartUrl {
  partNumber: number;
  url: string;
}

export interface MultipartInitiateResult {
  uploadId: string;
  bucket: string;
  objectKey: string;
  partSize: number;
}

export interface MultipartCompletedPart {
  PartNumber: number;
  ETag: string;
}

export interface StorageHealthResult {
  status: "healthy" | "unhealthy" | "degraded";
  endpoint: string;
  bucketsCount: number;
  accessibleBuckets: string[];
  latencyMs: number;
  error?: string;
  timestamp: string;
}

export interface FileRecord {
  id: string;
  userId: string;
  bucket: string;
  objectKey: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  etag?: string;
  status: "pending" | "uploaded" | "deleted" | "failed";
  customMetadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Enterprise S3 Lifecycle and Policy Models
export interface BucketLifecycleRule {
  id: string;
  status: "Enabled" | "Disabled";
  prefix: string;
  transitions?: Array<{
    days: number;
    storageClass: S3StorageClass;
  }>;
  expirationDays?: number;
  noncurrentVersionExpirationDays?: number;
}

export interface BucketCorsRule {
  allowedOrigins: string[];
  allowedMethods: ("GET" | "PUT" | "POST" | "DELETE" | "HEAD")[];
  allowedHeaders: string[];
  exposeHeaders?: string[];
  maxAgeSeconds?: number;
}

export interface S3AuditEvent {
  id: string;
  timestamp: string;
  operation: string;
  bucket?: string;
  objectKey?: string;
  statusCode: number;
  latencyMs: number;
  clientIp?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface BucketMetricsResult {
  bucket: string;
  totalObjects: number;
  totalSizeBytes: number;
  storageClassBreakdown: Record<string, { count: number; bytes: number }>;
  contentTypeBreakdown: Record<string, { count: number; bytes: number }>;
  lastCalculated: string;
}
