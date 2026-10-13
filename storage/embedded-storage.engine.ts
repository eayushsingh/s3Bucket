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
}
