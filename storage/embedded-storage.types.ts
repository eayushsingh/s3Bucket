/**
 * Architecture and data models for Embedded Fallback Storage Engine.
 * Provides high-fidelity local filesystem persistence when MinIO/S3 daemon is offline.
 */

export interface EmbeddedBucketMetadata {
  name: string;
  createdAt: string;
  isDefault: boolean;
  versioningEnabled?: boolean;
}

export interface EmbeddedObjectRecord {
  key: string;
  sizeBytes: number;
  lastModified: string;
  etag: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface EmbeddedEngineOptions {
  baseDirectory?: string;
  defaultBuckets?: string[];
}
