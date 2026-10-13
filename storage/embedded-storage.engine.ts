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
}



