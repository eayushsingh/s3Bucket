/**
 * Structured Storage Error Hierarchy
 */

export class StorageError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "STORAGE_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BucketNotFoundError extends StorageError {
  constructor(bucketName: string) {
    super(`Bucket '${bucketName}' does not exist.`, 404, "BUCKET_NOT_FOUND");
  }
}

export class BucketAlreadyExistsError extends StorageError {
  constructor(bucketName: string) {
    super(`Bucket '${bucketName}' already exists.`, 409, "BUCKET_ALREADY_EXISTS");
  }
}

export class ObjectNotFoundError extends StorageError {
  constructor(bucketName: string, objectKey: string) {
    super(`Object '${objectKey}' was not found in bucket '${bucketName}'.`, 404, "OBJECT_NOT_FOUND");
  }
}

export class InvalidBucketNameError extends StorageError {
  constructor(reason: string) {
    super(`Invalid bucket name: ${reason}`, 400, "INVALID_BUCKET_NAME");
  }
}

export class InvalidObjectKeyError extends StorageError {
  constructor(reason: string) {
    super(`Invalid object key: ${reason}`, 400, "INVALID_OBJECT_KEY");
  }
}

export class FileSizeExceededError extends StorageError {
  constructor(sizeBytes: number, maxBytes: number) {
    super(
      `File size (${(sizeBytes / 1024 / 1024).toFixed(2)} MB) exceeds allowed limit of ${(maxBytes / 1024 / 1024).toFixed(2)} MB.`,
      413,
      "FILE_SIZE_EXCEEDED"
    );
  }
}

export class InvalidMimeTypeError extends StorageError {
  constructor(mimeType: string, allowedTypes?: string[]) {
    const allowed = allowedTypes ? ` Allowed types: ${allowedTypes.join(", ")}` : "";
    super(`MIME type '${mimeType}' is not supported or disallowed.${allowed}`, 400, "INVALID_MIME_TYPE");
  }
}

export class UnauthorizedStorageAccessError extends StorageError {
  constructor(message = "You do not have permission to perform this storage operation.") {
    super(message, 403, "UNAUTHORIZED_STORAGE_ACCESS");
  }
}

export class StorageConnectionError extends StorageError {
  constructor(message = "Unable to connect to object storage service (MinIO/S3).") {
    super(message, 503, "STORAGE_CONNECTION_ERROR");
  }
}

export class MultipartUploadError extends StorageError {
  constructor(message: string) {
    super(message, 500, "MULTIPART_UPLOAD_ERROR");
  }
}
