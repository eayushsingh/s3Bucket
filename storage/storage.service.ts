import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  DeleteBucketLifecycleCommand,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  DeleteBucketCorsCommand,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
  DeleteBucketPolicyCommand,
  CopyObjectCommand,
  NotFound,
  NoSuchBucket,
  NoSuchKey,
  BucketAlreadyOwnedByYou,
  BucketAlreadyExists,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { getS3Client } from "./minio.client";
import { loadStorageConfig } from "./storage.config";
import { auditService } from "./audit.service";
import {
  BucketInfo,
  ObjectMetadata,
  ListObjectsOptions,
  ListObjectsResult,
  UploadPresignedUrlOptions,
  DownloadPresignedUrlOptions,
  PresignedUrlResult,
  MultipartInitiateResult,
  MultipartPartUrl,
  MultipartCompletedPart,
  StorageHealthResult,
  BucketLifecycleRule,
  BucketCorsRule,
  BucketMetricsResult,
  S3StorageClass,
} from "./storage.types";
import {
  StorageError,
  BucketNotFoundError,
  BucketAlreadyExistsError,
  ObjectNotFoundError,
  StorageConnectionError,
  MultipartUploadError,
} from "./storage.errors";
import { validateBucketName, validateObjectKey } from "./sanitizer";

export class StorageService {
  private client: S3Client;
  private config = loadStorageConfig();

  constructor(customClient?: S3Client) {
    this.client = customClient || getS3Client();
  }

  /**
   * Helper to map AWS/MinIO errors to domain-specific StorageErrors
   */
  private handleError(err: any, bucketName?: string, objectKey?: string): never {
    if (err instanceof StorageError) {
      throw err;
    }

    const name = err.name || err.code || "";
    const message = err.message || "Unknown storage error";

    if (name === "NoSuchBucket" || name === "NotFound" && bucketName && !objectKey) {
      throw new BucketNotFoundError(bucketName || "unknown");
    }

    if (name === "NoSuchKey" || (name === "NotFound" && objectKey)) {
      throw new ObjectNotFoundError(bucketName || "unknown", objectKey || "unknown");
    }

    if (name === "BucketAlreadyExists" || name === "BucketAlreadyOwnedByYou") {
      throw new BucketAlreadyExistsError(bucketName || "unknown");
    }

    if (
      err.code === "ECONNREFUSED" ||
      err.code === "ENOTFOUND" ||
      name === "NetworkingError" ||
      err.$metadata?.httpStatusCode === 503
    ) {
      throw new StorageConnectionError(
        `Failed to connect to MinIO/S3 endpoint at ${this.config.endpoint}: ${message}`
      );
    }

    throw new StorageError(
      message,
      err.$metadata?.httpStatusCode || 500,
      name || "STORAGE_OPERATION_FAILED"
    );
  }

  /**
   * Maps operation errors to domain-specific StorageErrors
   */
  private handleS3Error(err: any, _op: string, bucketName?: string, objectKey?: string): never {
    return this.handleError(err, bucketName, objectKey);
  }

  // ============================================================================
  // BUCKET OPERATIONS
  // ============================================================================

  /**
   * Lists all existing buckets in the storage layer.
   */
  async listBuckets(): Promise<BucketInfo[]> {
    try {
      const command = new ListBucketsCommand({});
      const response = await this.client.send(command);
      const buckets = response.Buckets || [];

      return buckets.map((b) => ({
        name: b.Name || "",
        creationDate: b.CreationDate,
        isDefault: this.config.defaultBuckets.includes(b.Name || ""),
      }));
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Checks if a bucket exists and is accessible.
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    validateBucketName(bucketName);
    try {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await this.client.send(command);
      return true;
    } catch (err: any) {
      if (
        err.name === "NotFound" ||
        err.name === "NoSuchBucket" ||
        err.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      return this.handleError(err, bucketName);
    }
  }

  /**
   * Creates a new bucket. Idempotent check if already exists.
   */
  async createBucket(bucketName: string): Promise<{ created: boolean; name: string }> {
    validateBucketName(bucketName);
    const exists = await this.bucketExists(bucketName);
    if (exists) {
      return { created: false, name: bucketName };
    }

    try {
      const command = new CreateBucketCommand({
        Bucket: bucketName,
      });
      await this.client.send(command);
      return { created: true, name: bucketName };
    } catch (err: any) {
      if (err.name === "BucketAlreadyExists" || err.name === "BucketAlreadyOwnedByYou") {
        return { created: false, name: bucketName };
      }
      return this.handleError(err, bucketName);
    }
  }

  /**
   * Deletes a bucket. Bucket must be empty.
   */
  async deleteBucket(bucketName: string, force = false): Promise<void> {
    validateBucketName(bucketName);

    if (force) {
      // Empty all objects inside before deleting
      const objects = await this.listObjects(bucketName);
      if (objects.objects.length > 0) {
        await this.deleteObjects(
          bucketName,
          objects.objects.map((o) => o.key)
        );
      }
    }

    try {
      const command = new DeleteBucketCommand({ Bucket: bucketName });
      await this.client.send(command);
    } catch (err) {
      this.handleError(err, bucketName);
    }
  }

  // ============================================================================
  // OBJECT QUERY & METADATA
  // ============================================================================

  /**
   * Lists objects in a bucket with optional prefix, pagination, and delimiter.
   */
  async listObjects(bucketName: string, options: ListObjectsOptions = {}): Promise<ListObjectsResult> {
    validateBucketName(bucketName);

    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: options.prefix || undefined,
        Delimiter: options.delimiter || undefined,
        MaxKeys: options.maxKeys || 1000,
        ContinuationToken: options.continuationToken || undefined,
      });

      const response = await this.client.send(command);

      const objects: ObjectMetadata[] = (response.Contents || []).map((item) => ({
        key: item.Key || "",
        size: item.Size || 0,
        lastModified: item.LastModified,
        etag: item.ETag ? item.ETag.replace(/"/g, "") : undefined,
      }));

      const prefixes: string[] = (response.CommonPrefixes || []).map(
        (p) => p.Prefix || ""
      );

      return {
        objects,
        prefixes,
        isTruncated: !!response.IsTruncated,
        nextContinuationToken: response.NextContinuationToken,
      };
    } catch (err) {
      return this.handleError(err, bucketName);
    }
  }

  /**
   * Checks if an object exists in a bucket.
   */
  async objectExists(bucketName: string, objectKey: string): Promise<boolean> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      });
      await this.client.send(command);
      return true;
    } catch (err: any) {
      if (
        err.name === "NotFound" ||
        err.name === "NoSuchKey" ||
        err.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      return this.handleError(err, bucketName, cleanKey);
    }
  }

  /**
   * Retrieves object metadata and headers.
   */
  async getObjectMetadata(bucketName: string, objectKey: string): Promise<ObjectMetadata> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      });
      const response = await this.client.send(command);

      return {
        key: cleanKey,
        size: response.ContentLength || 0,
        lastModified: response.LastModified,
        etag: response.ETag ? response.ETag.replace(/"/g, "") : undefined,
        contentType: response.ContentType,
        storageClass: response.StorageClass || "STANDARD",
        serverSideEncryption: response.ServerSideEncryption as any,
        versionId: response.VersionId,
        metadata: response.Metadata,
      };
    } catch (err) {
      return this.handleError(err, bucketName, cleanKey);
    }
  }

  /**
   * Retrieves object raw buffer content up to maxBytes for inline inspection and preview.
   */
  async getObjectContent(
    bucket: string,
    key: string,
    maxBytes: number = 524288
  ): Promise<{
    contentType: string;
    size: number;
    isTruncated: boolean;
    isBinary: boolean;
    text?: string;
    base64?: string;
    etag?: string;
  }> {
    validateBucketName(bucket);
    const cleanKey = validateObjectKey(key);
    const start = Date.now();

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: cleanKey,
        })
      );

      const contentType = response.ContentType || "application/octet-stream";
      const totalSize = response.ContentLength || 0;
      const stream = response.Body as Readable;

      const chunks: Buffer[] = [];
      let bytesRead = 0;
      let isTruncated = false;

      for await (const chunk of stream) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (bytesRead + buf.length > maxBytes) {
          const sliceSize = maxBytes - bytesRead;
          if (sliceSize > 0) {
            chunks.push(buf.subarray(0, sliceSize));
            bytesRead += sliceSize;
          }
          isTruncated = true;
          break;
        } else {
          chunks.push(buf);
          bytesRead += buf.length;
        }
      }

      const fullBuffer = Buffer.concat(chunks);

      // Binary detection: check for null bytes or control characters
      let isBinary = false;
      const checkSample = fullBuffer.subarray(0, Math.min(fullBuffer.length, 1024));
      for (let i = 0; i < checkSample.length; i++) {
        if (checkSample[i] === 0) {
          isBinary = true;
          break;
        }
      }

      const result = {
        contentType,
        size: totalSize,
        isTruncated,
        isBinary,
        text: isBinary ? undefined : fullBuffer.toString("utf-8"),
        base64: fullBuffer.toString("base64"),
        etag: response.ETag?.replace(/"/g, ""),
      };

      auditService.record({
        operation: "GetObjectContent",
        bucket,
        objectKey: cleanKey,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { bytesRead, totalSize, isBinary },
      });

      return result;
    } catch (err: any) {
      auditService.record({
        operation: "GetObjectContent",
        bucket,
        objectKey: cleanKey,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "getObjectContent", bucket, cleanKey);
    }
  }

  // ============================================================================
  // PRESIGNED URLS (ZERO-SERVER-BUFFERING DIRECT UPLOAD / DOWNLOAD)
  // ============================================================================

  /**
   * Generates a presigned PUT URL allowing clients (browsers) to upload directly to MinIO.
   */
  async createUploadPresignedUrl(options: UploadPresignedUrlOptions): Promise<PresignedUrlResult> {
    validateBucketName(options.bucket);
    const cleanKey = validateObjectKey(options.objectKey);
    const expiresIn = options.expiresInSeconds || this.config.presignedUploadExpirySeconds;

    try {
      const command = new PutObjectCommand({
        Bucket: options.bucket,
        Key: cleanKey,
        ContentType: options.contentType || "application/octet-stream",
        Metadata: options.metadata,
      });

      let url = await getSignedUrl(this.client, command, { expiresIn });

      // If public endpoint differs from internal MinIO URL (e.g., behind public reverse proxy), adjust host
      if (this.config.publicEndpoint && this.config.publicEndpoint !== this.config.endpoint) {
        url = url.replace(this.config.endpoint, this.config.publicEndpoint);
      }

      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      return {
        url,
        objectKey: cleanKey,
        bucket: options.bucket,
        expiresInSeconds: expiresIn,
        expiresAt,
        headers: {
          "Content-Type": options.contentType || "application/octet-stream",
        },
      };
    } catch (err) {
      return this.handleError(err, options.bucket, cleanKey);
    }
  }

  /**
   * Generates a presigned GET URL allowing authorized users to securely download or view objects.
   */
  async createDownloadPresignedUrl(options: DownloadPresignedUrlOptions): Promise<PresignedUrlResult> {
    validateBucketName(options.bucket);
    const cleanKey = validateObjectKey(options.objectKey);
    const expiresIn = options.expiresInSeconds || this.config.presignedDownloadExpirySeconds;

    try {
      const command = new GetObjectCommand({
        Bucket: options.bucket,
        Key: cleanKey,
        ResponseContentDisposition: options.responseDisposition,
        ResponseContentType: options.responseContentType,
      });

      let url = await getSignedUrl(this.client, command, { expiresIn });

      if (this.config.publicEndpoint && this.config.publicEndpoint !== this.config.endpoint) {
        url = url.replace(this.config.endpoint, this.config.publicEndpoint);
      }

      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      return {
        url,
        objectKey: cleanKey,
        bucket: options.bucket,
        expiresInSeconds: expiresIn,
        expiresAt,
      };
    } catch (err) {
      return this.handleError(err, options.bucket, cleanKey);
    }
  }

  // ============================================================================
  // DIRECT SERVER-SIDE STREAMING & OBJECT MUTATIONS
  // ============================================================================

  /**
   * Uploads an object directly from the server using stream or buffer.
   */
  async uploadObject(
    bucketName: string,
    objectKey: string,
    body: Buffer | Uint8Array | Blob | string | Readable,
    contentType = "application/octet-stream",
    metadata?: Record<string, string>
  ): Promise<{ key: string; etag?: string }> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
        Body: body as any,
        ContentType: contentType,
        Metadata: metadata,
      });

      const response = await this.client.send(command);
      return {
        key: cleanKey,
        etag: response.ETag ? response.ETag.replace(/"/g, "") : undefined,
      };
    } catch (err) {
      return this.handleError(err, bucketName, cleanKey);
    }
  }

  /**
   * Streams an object directly from MinIO.
   */
  async downloadObjectStream(
    bucketName: string,
    objectKey: string
  ): Promise<{ stream: Readable; contentType?: string; contentLength?: number; etag?: string }> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      });

      const response = await this.client.send(command);

      return {
        stream: response.Body as Readable,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        etag: response.ETag ? response.ETag.replace(/"/g, "") : undefined,
      };
    } catch (err) {
      return this.handleError(err, bucketName, cleanKey);
    }
  }

  /**
   * Deletes a single object.
   */
  async deleteObject(bucketName: string, objectKey: string): Promise<void> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      });
      await this.client.send(command);
    } catch (err) {
      this.handleError(err, bucketName, cleanKey);
    }
  }

  /**
   * Deletes multiple objects in a single batch request.
   */
  async deleteObjects(bucketName: string, objectKeys: string[]): Promise<{ deleted: string[]; errors: any[] }> {
    validateBucketName(bucketName);
    if (objectKeys.length === 0) return { deleted: [], errors: [] };

    const cleanKeys = objectKeys.map((k) => ({ Key: validateObjectKey(k) }));

    try {
      const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: cleanKeys,
          Quiet: false,
        },
      });

      const response = await this.client.send(command);
      const deleted = (response.Deleted || []).map((d) => d.Key || "");
      const errors = response.Errors || [];

      return { deleted, errors };
    } catch (err) {
      return this.handleError(err, bucketName);
    }
  }

  // ============================================================================
  // MULTIPART UPLOADS (LARGE FILE HANDLING > 5MB to 5TB)
  // ============================================================================

  /**
   * Initiates a multipart upload session.
   */
  async initiateMultipartUpload(
    bucketName: string,
    objectKey: string,
    contentType = "application/octet-stream",
    metadata?: Record<string, string>
  ): Promise<MultipartInitiateResult> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    try {
      const command = new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: cleanKey,
        ContentType: contentType,
        Metadata: metadata,
      });

      const response = await this.client.send(command);
      if (!response.UploadId) {
        throw new MultipartUploadError("Failed to obtain UploadId from storage provider.");
      }

      return {
        uploadId: response.UploadId,
        bucket: bucketName,
        objectKey: cleanKey,
        partSize: 10 * 1024 * 1024, // Suggested default part size: 10MB
      };
    } catch (err) {
      return this.handleError(err, bucketName, cleanKey);
    }
  }

  /**
   * Generates presigned URLs for each part in a multipart upload.
   */
  async createPresignedPartUrls(
    bucketName: string,
    objectKey: string,
    uploadId: string,
    partCount: number,
    expiresInSeconds = 3600
  ): Promise<MultipartPartUrl[]> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    if (partCount < 1 || partCount > 10000) {
      throw new MultipartUploadError(`Part count must be between 1 and 10,000 (got ${partCount}).`);
    }

    try {
      const partUrls: MultipartPartUrl[] = [];

      for (let partNumber = 1; partNumber <= partCount; partNumber++) {
        const command = new UploadPartCommand({
          Bucket: bucketName,
          Key: cleanKey,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        let url = await getSignedUrl(this.client, command, {
          expiresIn: expiresInSeconds,
        });

        if (this.config.publicEndpoint && this.config.publicEndpoint !== this.config.endpoint) {
          url = url.replace(this.config.endpoint, this.config.publicEndpoint);
        }

        partUrls.push({
          partNumber,
          url,
        });
      }

      return partUrls;
    } catch (err) {
      return this.handleError(err, bucketName, cleanKey);
    }
  }

  /**
   * Completes a multipart upload after all parts have been uploaded.
   */
  async completeMultipartUpload(
    bucketName: string,
    objectKey: string,
    uploadId: string,
    parts: MultipartCompletedPart[]
  ): Promise<{ key: string; etag?: string; location?: string }> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    // Parts must be sorted by part number ascending
    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: cleanKey,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts.map((p) => ({
            PartNumber: p.PartNumber,
            ETag: p.ETag.startsWith('"') ? p.ETag : `"${p.ETag}"`,
          })),
        },
      });

      const response = await this.client.send(command);
      return {
        key: cleanKey,
        etag: response.ETag ? response.ETag.replace(/"/g, "") : undefined,
        location: response.Location,
      };
    } catch (err) {
      return this.handleError(err, bucketName, cleanKey);
    }
  }

  /**
   * Aborts an in-progress multipart upload and purges uploaded chunks.
   */
  async abortMultipartUpload(bucketName: string, objectKey: string, uploadId: string): Promise<void> {
    validateBucketName(bucketName);
    const cleanKey = validateObjectKey(objectKey);

    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: cleanKey,
        UploadId: uploadId,
      });
      await this.client.send(command);
    } catch (err) {
      this.handleError(err, bucketName, cleanKey);
    }
  }

  // ============================================================================
  // OBSERVABILITY & HEALTH CHECK
  // ============================================================================

  /**
   * Retrieves the current versioning state of an S3 bucket.
   */
  async getBucketVersioning(bucket: string): Promise<"Enabled" | "Suspended" | "Disabled"> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      const response = await this.client.send(
        new GetBucketVersioningCommand({ Bucket: bucket })
      );
      const status = response.Status || "Disabled";
      auditService.record({
        operation: "GetBucketVersioning",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { status },
      });
      return status as "Enabled" | "Suspended" | "Disabled";
    } catch (err: any) {
      auditService.record({
        operation: "GetBucketVersioning",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "getBucketVersioning", bucket);
    }
  }

  /**
   * Configures versioning state for an S3 bucket (Enabled or Suspended).
   */
  async setBucketVersioning(bucket: string, status: "Enabled" | "Suspended"): Promise<void> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      await this.client.send(
        new PutBucketVersioningCommand({
          Bucket: bucket,
          VersioningConfiguration: {
            Status: status,
          },
        })
      );
      auditService.record({
        operation: "PutBucketVersioning",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { configuredStatus: status },
      });
    } catch (err: any) {
      auditService.record({
        operation: "PutBucketVersioning",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "setBucketVersioning", bucket);
    }
  }

  /**
   * Retrieves active S3 lifecycle configuration rules for an object storage bucket.
   */
  async getBucketLifecycle(bucket: string): Promise<BucketLifecycleRule[]> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      const response = await this.client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucket })
      );
      const rules: BucketLifecycleRule[] = (response.Rules || []).map((r) => ({
        id: r.ID || "rule",
        status: (r.Status as "Enabled" | "Disabled") || "Enabled",
        prefix: r.Filter?.Prefix || (r.Prefix as string) || "",
        transitions: (r.Transitions || []).map((t) => ({
          days: t.Days || 0,
          storageClass: (t.StorageClass as any) || "GLACIER",
        })),
        expirationDays: r.Expiration?.Days,
        noncurrentVersionExpirationDays: r.NoncurrentVersionExpiration?.NoncurrentDays,
      }));

      auditService.record({
        operation: "GetBucketLifecycle",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { ruleCount: rules.length },
      });

      return rules;
    } catch (err: any) {
      if (err.name === "NoSuchLifecycleConfiguration" || err.$metadata?.httpStatusCode === 404) {
        auditService.record({
          operation: "GetBucketLifecycle",
          bucket,
          statusCode: 200,
          latencyMs: Date.now() - start,
          details: { ruleCount: 0, note: "No lifecycle policy defined" },
        });
        return [];
      }
      auditService.record({
        operation: "GetBucketLifecycle",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "getBucketLifecycle", bucket);
    }
  }

  /**
   * Applies lifecycle configuration rules to an S3 bucket.
   */
  async putBucketLifecycle(bucket: string, rules: BucketLifecycleRule[]): Promise<void> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      const s3Rules = rules.map((r) => ({
        ID: r.id,
        Status: r.status,
        Filter: { Prefix: r.prefix || "" },
        Transitions: (r.transitions || []).map((t) => ({
          Days: t.days,
          StorageClass: t.storageClass as any,
        })),
        ...(r.expirationDays ? { Expiration: { Days: r.expirationDays } } : {}),
        ...(r.noncurrentVersionExpirationDays
          ? {
              NoncurrentVersionExpiration: {
                NoncurrentDays: r.noncurrentVersionExpirationDays,
              },
            }
          : {}),
      }));

      await this.client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: bucket,
          LifecycleConfiguration: {
            Rules: s3Rules,
          },
        })
      );

      auditService.record({
        operation: "PutBucketLifecycle",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { appliedRuleCount: rules.length },
      });
    } catch (err: any) {
      auditService.record({
        operation: "PutBucketLifecycle",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "putBucketLifecycle", bucket);
    }
  }

  /**
   * Removes lifecycle configuration from an S3 bucket.
   */
  async deleteBucketLifecycle(bucket: string): Promise<void> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      await this.client.send(
        new DeleteBucketLifecycleCommand({ Bucket: bucket })
      );
      auditService.record({
        operation: "DeleteBucketLifecycle",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
      });
    } catch (err: any) {
      auditService.record({
        operation: "DeleteBucketLifecycle",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "deleteBucketLifecycle", bucket);
    }
  }

  /**
   * Retrieves active CORS configuration rules for an S3 bucket.
   */
  async getBucketCors(bucket: string): Promise<BucketCorsRule[]> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      const response = await this.client.send(
        new GetBucketCorsCommand({ Bucket: bucket })
      );
      const rules: BucketCorsRule[] = (response.CORSRules || []).map((r) => ({
        allowedOrigins: r.AllowedOrigins || [],
        allowedMethods: (r.AllowedMethods || []) as any,
        allowedHeaders: r.AllowedHeaders || [],
        exposeHeaders: r.ExposeHeaders || [],
        maxAgeSeconds: r.MaxAgeSeconds,
      }));

      auditService.record({
        operation: "GetBucketCors",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { ruleCount: rules.length },
      });

      return rules;
    } catch (err: any) {
      if (err.name === "NoSuchCORSConfiguration" || err.$metadata?.httpStatusCode === 404) {
        auditService.record({
          operation: "GetBucketCors",
          bucket,
          statusCode: 200,
          latencyMs: Date.now() - start,
          details: { ruleCount: 0, note: "No CORS policy configured" },
        });
        return [];
      }
      auditService.record({
        operation: "GetBucketCors",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "getBucketCors", bucket);
    }
  }

  /**
   * Applies CORS configuration rules to an S3 bucket.
   */
  async putBucketCors(bucket: string, rules: BucketCorsRule[]): Promise<void> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      const corsRules = rules.map((r) => ({
        AllowedOrigins: r.allowedOrigins,
        AllowedMethods: r.allowedMethods,
        AllowedHeaders: r.allowedHeaders,
        ExposeHeaders: r.exposeHeaders,
        MaxAgeSeconds: r.maxAgeSeconds,
      }));

      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: corsRules,
          },
        })
      );

      auditService.record({
        operation: "PutBucketCors",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { appliedRuleCount: rules.length },
      });
    } catch (err: any) {
      auditService.record({
        operation: "PutBucketCors",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "putBucketCors", bucket);
    }
  }

  /**
   * Removes CORS configuration from an S3 bucket.
   */
  async deleteBucketCors(bucket: string): Promise<void> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      await this.client.send(
        new DeleteBucketCorsCommand({ Bucket: bucket })
      );
      auditService.record({
        operation: "DeleteBucketCors",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
      });
    } catch (err: any) {
      auditService.record({
        operation: "DeleteBucketCors",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "deleteBucketCors", bucket);
    }
  }

  /**
   * Retrieves active access control policy (JSON string) for an S3 bucket.
   */
  async getBucketPolicy(bucket: string): Promise<string> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      const response = await this.client.send(
        new GetBucketPolicyCommand({ Bucket: bucket })
      );
      const policy = response.Policy || "";
      auditService.record({
        operation: "GetBucketPolicy",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { policyLength: policy.length },
      });
      return policy;
    } catch (err: any) {
      if (err.name === "NoSuchBucketPolicy" || err.$metadata?.httpStatusCode === 404) {
        auditService.record({
          operation: "GetBucketPolicy",
          bucket,
          statusCode: 200,
          latencyMs: Date.now() - start,
          details: { note: "No bucket policy set" },
        });
        return "";
      }
      auditService.record({
        operation: "GetBucketPolicy",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "getBucketPolicy", bucket);
    }
  }

  /**
   * Sets or updates access control policy (JSON format) on an S3 bucket.
   */
  async putBucketPolicy(bucket: string, policyJson: string): Promise<void> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      // Validate JSON formatting
      JSON.parse(policyJson);

      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: policyJson,
        })
      );

      auditService.record({
        operation: "PutBucketPolicy",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { policyLength: policyJson.length },
      });
    } catch (err: any) {
      auditService.record({
        operation: "PutBucketPolicy",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "putBucketPolicy", bucket);
    }
  }

  /**
   * Deletes access control policy from an S3 bucket.
   */
  async deleteBucketPolicy(bucket: string): Promise<void> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      await this.client.send(
        new DeleteBucketPolicyCommand({ Bucket: bucket })
      );
      auditService.record({
        operation: "DeleteBucketPolicy",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
      });
    } catch (err: any) {
      auditService.record({
        operation: "DeleteBucketPolicy",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "deleteBucketPolicy", bucket);
    }
  }

  /**
   * Computes comprehensive storage metrics, storage-class allocation, and MIME breakdown.
   */
  async getBucketMetrics(bucket: string): Promise<BucketMetricsResult> {
    validateBucketName(bucket);
    const start = Date.now();
    try {
      let isTruncated = true;
      let continuationToken: string | undefined = undefined;
      let totalObjects = 0;
      let totalSizeBytes = 0;
      const storageClassBreakdown: Record<string, { count: number; bytes: number }> = {};
      const contentTypeBreakdown: Record<string, { count: number; bytes: number }> = {};

      while (isTruncated) {
        const response: any = await this.client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
          })
        );

        for (const item of response.Contents || []) {
          totalObjects += 1;
          const size = item.Size || 0;
          totalSizeBytes += size;

          const sc = item.StorageClass || "STANDARD";
          if (!storageClassBreakdown[sc]) {
            storageClassBreakdown[sc] = { count: 0, bytes: 0 };
          }
          storageClassBreakdown[sc].count += 1;
          storageClassBreakdown[sc].bytes += size;

          // Categorize by key extension
          const key = item.Key || "";
          const ext = key.includes(".") ? key.split(".").pop()?.toLowerCase() || "unknown" : "unknown";
          let category = "binaries";
          if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"].includes(ext)) {
            category = "images";
          } else if (["json", "yaml", "yml", "xml", "csv", "tsv", "txt", "md"].includes(ext)) {
            category = "documents";
          } else if (["zip", "tar", "gz", "tgz", "7z", "rar"].includes(ext)) {
            category = "archives";
          } else if (["mp3", "wav", "ogg", "flac"].includes(ext)) {
            category = "audio";
          } else if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
            category = "video";
          } else if (["ts", "js", "py", "rs", "go", "java", "c", "cpp", "html", "css"].includes(ext)) {
            category = "code";
          }

          if (!contentTypeBreakdown[category]) {
            contentTypeBreakdown[category] = { count: 0, bytes: 0 };
          }
          contentTypeBreakdown[category].count += 1;
          contentTypeBreakdown[category].bytes += size;
        }

        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
      }

      const result: BucketMetricsResult = {
        bucket,
        totalObjects,
        totalSizeBytes,
        storageClassBreakdown,
        contentTypeBreakdown,
        lastCalculated: new Date().toISOString(),
      };

      auditService.record({
        operation: "GetBucketMetrics",
        bucket,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { totalObjects, totalSizeBytes },
      });

      return result;
    } catch (err: any) {
      auditService.record({
        operation: "GetBucketMetrics",
        bucket,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "getBucketMetrics", bucket);
    }
  }

  /**
   * Copies an S3 object within or across buckets, optionally modifying storage class.
   */
  async copyObject(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string,
    options?: { storageClass?: S3StorageClass }
  ): Promise<void> {
    validateBucketName(sourceBucket);
    validateBucketName(destBucket);
    validateObjectKey(sourceKey);
    validateObjectKey(destKey);
    const start = Date.now();

    try {
      const copySource = `${sourceBucket}/${encodeURIComponent(sourceKey)}`;
      await this.client.send(
        new CopyObjectCommand({
          Bucket: destBucket,
          Key: destKey,
          CopySource: copySource,
          ...(options?.storageClass ? { StorageClass: options.storageClass as any } : {}),
        })
      );

      auditService.record({
        operation: "CopyObject",
        bucket: destBucket,
        objectKey: destKey,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { sourceBucket, sourceKey, storageClass: options?.storageClass },
      });
    } catch (err: any) {
      auditService.record({
        operation: "CopyObject",
        bucket: destBucket,
        objectKey: destKey,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "copyObject", destBucket, destKey);
    }
  }

  /**
   * Updates the storage class tier of an existing S3 object via in-place copy.
   */
  async updateObjectStorageClass(
    bucket: string,
    key: string,
    newStorageClass: S3StorageClass
  ): Promise<void> {
    validateBucketName(bucket);
    validateObjectKey(key);
    const start = Date.now();

    try {
      const copySource = `${bucket}/${encodeURIComponent(key)}`;
      await this.client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: key,
          CopySource: copySource,
          StorageClass: newStorageClass as any,
          MetadataDirective: "COPY",
        })
      );

      auditService.record({
        operation: "TransitionStorageClass",
        bucket,
        objectKey: key,
        statusCode: 200,
        latencyMs: Date.now() - start,
        details: { newStorageClass },
      });
    } catch (err: any) {
      auditService.record({
        operation: "TransitionStorageClass",
        bucket,
        objectKey: key,
        statusCode: 500,
        latencyMs: Date.now() - start,
        details: { error: err.message },
      });
      throw this.handleS3Error(err, "updateObjectStorageClass", bucket, key);
    }
  }

  /**
   * Performs an end-to-end latency and connectivity health probe on the storage engine.
   */
  async checkHealth(): Promise<StorageHealthResult> {
    const start = Date.now();
    try {
      const buckets = await this.listBuckets();
      const latencyMs = Date.now() - start;

      return {
        status: "healthy",
        endpoint: this.config.endpoint,
        bucketsCount: buckets.length,
        accessibleBuckets: buckets.map((b) => b.name),
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        status: "unhealthy",
        endpoint: this.config.endpoint,
        bucketsCount: 0,
        accessibleBuckets: [],
        latencyMs,
        error: err.message || "Storage service unreachable",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
