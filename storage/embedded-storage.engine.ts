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

  /**
   * Lists objects within an embedded bucket matching optional prefix and delimiter.
   */
  async listObjects(
    bucket: string,
    options: { prefix?: string; delimiter?: string } = {}
  ): Promise<{
    objects: { key: string; size: number; lastModified?: Date; etag?: string }[];
    prefixes: string[];
  }> {
    validateBucketName(bucket);
    if (!(await this.bucketExists(bucket))) {
      throw new BucketNotFoundError(bucket);
    }

    const bPath = this.getBucketPath(bucket);
    const objects: { key: string; size: number; lastModified?: Date; etag?: string }[] = [];
    const prefixes = new Set<string>();

    const scan = (dir: string, currentPrefix: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.endsWith(".meta.json") || item.name.startsWith(".")) continue;

        const relPath = currentPrefix ? `${currentPrefix}/${item.name}` : item.name;

        if (item.isDirectory()) {
          if (options.delimiter) {
            prefixes.add(`${relPath}/`);
          } else {
            scan(path.join(dir, item.name), relPath);
          }
        } else {
          if (!options.prefix || relPath.startsWith(options.prefix)) {
            const stat = fs.statSync(path.join(dir, item.name));
            const metaPath = this.getObjectMetaPath(bucket, relPath);
            let etag: string | undefined;

            if (fs.existsSync(metaPath)) {
              try {
                const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
                etag = meta.etag;
              } catch {
                // Ignore corrupted sidecar
              }
            }

            objects.push({
              key: relPath,
              size: stat.size,
              lastModified: stat.mtime,
              etag,
            });
          }
        }
      }
    };

    scan(bPath, "");

    return {
      objects,
      prefixes: Array.from(prefixes),
    };
  }

  /**
   * Retrieves an object body and metadata from the local store.
   */
  async getObject(
    bucket: string,
    key: string
  ): Promise<{
    body: Buffer;
    contentType: string;
    contentLength: number;
    etag?: string;
    lastModified?: Date;
    metadata?: Record<string, string>;
  }> {
    validateBucketName(bucket);
    if (!(await this.bucketExists(bucket))) {
      throw new BucketNotFoundError(bucket);
    }

    const objPath = this.getObjectPath(bucket, key);
    if (!fs.existsSync(objPath) || fs.statSync(objPath).isDirectory()) {
      throw new ObjectNotFoundError(bucket, key);
    }

    const stat = fs.statSync(objPath);
    const body = fs.readFileSync(objPath);
    let contentType = "application/octet-stream";
    let etag: string | undefined;
    let metadata: Record<string, string> | undefined;

    const metaPath = this.getObjectMetaPath(bucket, key);
    if (fs.existsSync(metaPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        contentType = raw.contentType || contentType;
        etag = raw.etag;
        metadata = raw.metadata;
      } catch {
        // Fallback
      }
    }

    return {
      body,
      contentType,
      contentLength: stat.size,
      etag,
      lastModified: stat.mtime,
      metadata,
    };
  }

  /**
   * Reads metadata headers for an object.
   */
  async headObject(
    bucket: string,
    key: string
  ): Promise<{
    contentLength: number;
    contentType: string;
    etag?: string;
    lastModified?: Date;
  }> {
    const res = await this.getObject(bucket, key);
    return {
      contentLength: res.contentLength,
      contentType: res.contentType,
      etag: res.etag,
      lastModified: res.lastModified,
    };
  }

  /**
   * Removes a single object from a bucket.
   */
  async deleteObject(bucket: string, key: string): Promise<void> {
    validateBucketName(bucket);
    const objPath = this.getObjectPath(bucket, key);
    if (fs.existsSync(objPath)) {
      fs.unlinkSync(objPath);
    }
    const metaPath = this.getObjectMetaPath(bucket, key);
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  }

  /**
   * Deletes multiple objects in batch.
   */
  async deleteObjects(bucket: string, keys: string[]): Promise<string[]> {
    const deleted: string[] = [];
    for (const key of keys) {
      await this.deleteObject(bucket, key);
      deleted.push(key);
    }
    return deleted;
  }
}








