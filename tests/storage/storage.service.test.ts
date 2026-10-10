import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService } from "@/storage/storage.service";
import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("http://127.0.0.1:9000/app-uploads/test.txt?X-Amz-Signature=mock123"),
}));

describe("StorageService (S3-Compatible Layer)", () => {
  let mockClient: S3Client;
  let service: StorageService;
  let sendSpy: any;

  beforeEach(() => {
    mockClient = new S3Client({
      region: "us-east-1",
      endpoint: "http://127.0.0.1:9000",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: true,
    });
    sendSpy = vi.spyOn(mockClient, "send");
    service = new StorageService(mockClient);
  });

  describe("listBuckets", () => {
    it("returns formatted bucket list", async () => {
      const now = new Date();
      sendSpy.mockResolvedValueOnce({
        Buckets: [
          { Name: "app-uploads", CreationDate: now },
          { Name: "custom-bucket", CreationDate: now },
        ],
      });

      const buckets = await service.listBuckets();
      expect(sendSpy).toHaveBeenCalledWith(expect.any(ListBucketsCommand));
      expect(buckets).toHaveLength(2);
      expect(buckets[0].name).toBe("app-uploads");
      expect(buckets[0].isDefault).toBe(true);
      expect(buckets[1].name).toBe("custom-bucket");
      expect(buckets[1].isDefault).toBe(false);
    });
  });

  describe("bucketExists", () => {
    it("returns true when HeadBucket succeeds", async () => {
      sendSpy.mockResolvedValueOnce({});
      const exists = await service.bucketExists("test-bucket");
      expect(exists).toBe(true);
      expect(sendSpy).toHaveBeenCalledWith(expect.any(HeadBucketCommand));
    });

    it("returns false when HeadBucket returns 404/NotFound", async () => {
      const notFoundErr = new Error("NotFound");
      (notFoundErr as any).name = "NotFound";
      sendSpy.mockRejectedValueOnce(notFoundErr);

      const exists = await service.bucketExists("missing-bucket");
      expect(exists).toBe(false);
    });
  });

  describe("createBucket", () => {
    it("creates bucket if it does not exist", async () => {
      // First call for bucketExists returns false
      const notFoundErr = new Error("NotFound");
      (notFoundErr as any).name = "NotFound";
      sendSpy.mockRejectedValueOnce(notFoundErr);
      // Second call for CreateBucket succeeds
      sendSpy.mockResolvedValueOnce({});

      const result = await service.createBucket("new-bucket");
      expect(result.created).toBe(true);
      expect(result.name).toBe("new-bucket");
      expect(sendSpy).toHaveBeenCalledWith(expect.any(CreateBucketCommand));
    });

    it("is idempotent if bucket already exists", async () => {
      sendSpy.mockResolvedValueOnce({}); // bucketExists returns true
      const result = await service.createBucket("existing-bucket");
      expect(result.created).toBe(false);
      expect(result.name).toBe("existing-bucket");
    });
  });

  describe("objectExists & getObjectMetadata", () => {
    it("returns object metadata successfully", async () => {
      const now = new Date();
      sendSpy.mockResolvedValueOnce({
        ContentLength: 1024,
        LastModified: now,
        ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
        ContentType: "image/png",
        Metadata: { "uploaded-by": "admin" },
      });

      const metadata = await service.getObjectMetadata("my-bucket", "images/logo.png");
      expect(metadata.key).toBe("images/logo.png");
      expect(metadata.size).toBe(1024);
      expect(metadata.contentType).toBe("image/png");
      expect(metadata.etag).toBe("d41d8cd98f00b204e9800998ecf8427e");
    });
  });

  describe("presigned URLs", () => {
    it("generates presigned upload URL for direct browser PUT", async () => {
      const res = await service.createUploadPresignedUrl({
        bucket: "app-uploads",
        objectKey: "uploads/test.txt",
        contentType: "text/plain",
        expiresInSeconds: 600,
      });

      expect(res.bucket).toBe("app-uploads");
      expect(res.objectKey).toBe("uploads/test.txt");
      expect(res.expiresInSeconds).toBe(600);
      expect(res.url).toContain("http://127.0.0.1:9000/app-uploads/test.txt");
    });

    it("generates presigned download URL with expiry", async () => {
      const res = await service.createDownloadPresignedUrl({
        bucket: "app-uploads",
        objectKey: "uploads/test.txt",
        expiresInSeconds: 1200,
      });

      expect(res.bucket).toBe("app-uploads");
      expect(res.objectKey).toBe("uploads/test.txt");
      expect(res.expiresInSeconds).toBe(1200);
      expect(res.url).toContain("http://127.0.0.1:9000/app-uploads/test.txt");
    });
  });
});
