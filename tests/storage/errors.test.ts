import { describe, it, expect } from "vitest";
import {
  StorageError,
  BucketNotFoundError,
  BucketAlreadyExistsError,
  ObjectNotFoundError,
  FileSizeExceededError,
  InvalidMimeTypeError,
  UnauthorizedStorageAccessError,
  StorageConnectionError,
} from "@/storage/storage.errors";

describe("Storage Error Hierarchy", () => {
  it("creates BucketNotFoundError with 404 status", () => {
    const err = new BucketNotFoundError("test-bucket");
    expect(err).toBeInstanceOf(StorageError);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("BUCKET_NOT_FOUND");
    expect(err.message).toContain("test-bucket");
  });

  it("creates ObjectNotFoundError with 404 status", () => {
    const err = new ObjectNotFoundError("test-bucket", "docs/file.pdf");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("OBJECT_NOT_FOUND");
    expect(err.message).toContain("docs/file.pdf");
  });

  it("creates FileSizeExceededError with 413 status", () => {
    const err = new FileSizeExceededError(100 * 1024 * 1024, 50 * 1024 * 1024);
    expect(err.statusCode).toBe(413);
    expect(err.code).toBe("FILE_SIZE_EXCEEDED");
  });

  it("creates StorageConnectionError with 503 status", () => {
    const err = new StorageConnectionError("Connection refused");
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("STORAGE_CONNECTION_ERROR");
  });
});
