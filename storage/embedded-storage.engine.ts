import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  EmbeddedBucketMetadata,
  EmbeddedObjectRecord,
  EmbeddedEngineOptions,
} from "./embedded-storage.types";
import {
  BucketNotFoundError,
  BucketAlreadyExistsError,
  ObjectNotFoundError,
  InvalidBucketNameError,
} from "./storage.errors";
import { validateBucketName } from "./sanitizer";

export class EmbeddedStorageEngine {
  private baseDir: string;

  constructor(options: EmbeddedEngineOptions = {}) {
    const raw = options.baseDirectory || "minio_data";
    this.baseDir = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getBucketPath(bucket: string): string {
    return path.join(this.baseDir, bucket);
  }

  private getBucketMetaPath(bucket: string): string {
    return path.join(this.baseDir, `${bucket}.bucket-meta.json`);
  }

  private getObjectPath(bucket: string, key: string): string {
    return path.join(this.getBucketPath(bucket), key);
  }

  private getObjectMetaPath(bucket: string, key: string): string {
    return path.join(this.getBucketPath(bucket), `${key}.meta.json`);
  }

  /**
   * Checks whether a bucket directory exists on disk.
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    validateBucketName(bucketName);
    const bPath = this.getBucketPath(bucketName);
    return fs.existsSync(bPath) && fs.statSync(bPath).isDirectory();
  }

  /**
   * Creates a new bucket directory idempotently with metadata sidecar.
   */
  async createBucket(bucketName: string): Promise<{ created: boolean; name: string }> {
    validateBucketName(bucketName);
    const bPath = this.getBucketPath(bucketName);

    if (await this.bucketExists(bucketName)) {
      return { created: false, name: bucketName };
    }

    fs.mkdirSync(bPath, { recursive: true });

    const meta: EmbeddedBucketMetadata = {
      name: bucketName,
      createdAt: new Date().toISOString(),
      isDefault: false,
    };
    fs.writeFileSync(this.getBucketMetaPath(bucketName), JSON.stringify(meta, null, 2));

    return { created: true, name: bucketName };
  }

  /**
   * Lists all existing bucket directories in the embedded data folder.
   */
  async listBuckets(): Promise<{ name: string; creationDate?: Date; isDefault?: boolean }[]> {
    if (!fs.existsSync(this.baseDir)) return [];

    const entries = fs.readdirSync(this.baseDir, { withFileTypes: true });
    const buckets: { name: string; creationDate?: Date; isDefault?: boolean }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        const metaPath = this.getBucketMetaPath(entry.name);
        let creationDate = new Date();
        let isDefault = false;

        if (fs.existsSync(metaPath)) {
          try {
            const raw = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
            creationDate = new Date(raw.createdAt);
            isDefault = !!raw.isDefault;
          } catch {
            // Use stat date
          }
        }

        buckets.push({
          name: entry.name,
          creationDate,
          isDefault,
        });
      }
    }

    return buckets;
  }

  /**
   * Deletes a bucket directory.
   */
  async deleteBucket(bucketName: string, force = false): Promise<void> {
    validateBucketName(bucketName);
    if (!(await this.bucketExists(bucketName))) {
      throw new BucketNotFoundError(bucketName);
    }

    const bPath = this.getBucketPath(bucketName);
    const files = fs.readdirSync(bPath);
    if (files.length > 0 && !force) {
      throw new Error(`Bucket '${bucketName}' is not empty.`);
    }

    fs.rmSync(bPath, { recursive: true, force: true });
    const metaPath = this.getBucketMetaPath(bucketName);
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  }

  /**
   * Persists an object payload and its metadata sidecar onto local disk.
   */
  async putObject(options: {
    bucket: string;
    key: string;
    body: Buffer | Uint8Array | string;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<{ key: string; etag: string; size: number }> {
    validateBucketName(options.bucket);
    if (!(await this.bucketExists(options.bucket))) {
      await this.createBucket(options.bucket);
    }

    const objPath = this.getObjectPath(options.bucket, options.key);
    const parentDir = path.dirname(objPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const buffer = Buffer.isBuffer(options.body)
      ? options.body
      : Buffer.from(options.body);

    fs.writeFileSync(objPath, buffer);
    const hash = crypto.createHash("md5").update(buffer).digest("hex");

    const record: EmbeddedObjectRecord = {
      key: options.key,
      sizeBytes: buffer.length,
      lastModified: new Date().toISOString(),
      etag: hash,
      contentType: options.contentType || "application/octet-stream",
      metadata: options.metadata || {},
    };

    fs.writeFileSync(
      this.getObjectMetaPath(options.bucket, options.key),
      JSON.stringify(record, null, 2)
    );

    return {
      key: options.key,
      etag: hash,
      size: buffer.length,
    };
  }
}





