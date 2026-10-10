import crypto from "crypto";
import { InvalidBucketNameError, InvalidObjectKeyError } from "./storage.errors";

// AWS/MinIO compliant bucket name regex (3-63 chars, lowercase, numbers, hyphens, no consecutive hyphens/dots)
const BUCKET_NAME_REGEX = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

/**
 * Validates S3 bucket names according to AWS/MinIO standards.
 */
export function validateBucketName(bucketName: string): void {
  if (!bucketName || typeof bucketName !== "string") {
    throw new InvalidBucketNameError("Bucket name must be a non-empty string.");
  }
  if (bucketName.length < 3 || bucketName.length > 63) {
    throw new InvalidBucketNameError(`Bucket name length must be between 3 and 63 characters (got ${bucketName.length}).`);
  }
  if (!BUCKET_NAME_REGEX.test(bucketName)) {
    throw new InvalidBucketNameError(
      "Bucket name must contain only lowercase letters, numbers, hyphens, or periods, and start/end with a letter or number."
    );
  }
  if (bucketName.includes("..") || bucketName.includes(".-") || bucketName.includes("-.")) {
    throw new InvalidBucketNameError("Bucket name cannot contain consecutive dots or dot-hyphen combinations.");
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(bucketName)) {
    throw new InvalidBucketNameError("Bucket name must not be formatted as an IP address.");
  }
}

/**
 * Validates and normalizes object keys.
 * Protects against Directory Traversal (../), Null Byte injections, and hazardous characters.
 */
export function validateObjectKey(objectKey: string): string {
  if (!objectKey || typeof objectKey !== "string") {
    throw new InvalidObjectKeyError("Object key must be a non-empty string.");
  }

  // Null byte injection check
  if (objectKey.indexOf("\0") !== -1) {
    throw new InvalidObjectKeyError("Object key contains illegal null bytes.");
  }

  // Path traversal check
  const normalized = objectKey.replace(/\\/g, "/").replace(/\/+/g, "/");
  const segments = normalized.split("/");
  for (const seg of segments) {
    if (seg === "..") {
      throw new InvalidObjectKeyError("Directory traversal (..) is strictly prohibited in object keys.");
    }
  }

  // Remove leading slash for S3 standard consistency
  const cleanKey = normalized.startsWith("/") ? normalized.slice(1) : normalized;

  if (cleanKey.length === 0) {
    throw new InvalidObjectKeyError("Object key cannot be empty or root slash.");
  }

  if (cleanKey.length > 1024) {
    throw new InvalidObjectKeyError("Object key exceeds maximum length of 1024 characters.");
  }

  return cleanKey;
}

/**
 * Sanitizes a user-supplied original filename to safe ASCII/Unicode characters.
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return "unnamed_file";
  // Strip path segments if sent as a full path
  const baseName = fileName.split(/[/\\]/).pop() || "unnamed_file";
  // Remove special shell/injection characters while keeping extension
  return baseName
    .replace(/[^\w.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\./, "_.");
}

/**
 * Generates a safe, collision-resistant object key.
 * Format: [prefix/][userId/][YYYY/MM/DD/][uuid]-[sanitizedFileName]
 */
export function generateSafeObjectKey(options: {
  originalFileName: string;
  prefix?: string;
  userId?: string;
  includeDatePrefix?: boolean;
}): string {
  const safeName = sanitizeFileName(options.originalFileName);
  const uuid = crypto.randomUUID();
  const parts: string[] = [];

  if (options.prefix) {
    parts.push(options.prefix.replace(/^\/+|\/+$/g, ""));
  }

  if (options.userId) {
    parts.push(`user_${options.userId}`);
  }

  if (options.includeDatePrefix) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    parts.push(`${year}/${month}/${day}`);
  }

  parts.push(`${uuid}-${safeName}`);

  return validateObjectKey(parts.join("/"));
}
