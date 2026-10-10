import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService } from "@/storage/storage.service";
import {
  S3Client,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";

describe("StorageService Governance (Versioning, Lifecycle, CORS)", () => {
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

  describe("getBucketVersioning", () => {
    it("returns 'Enabled' when versioning is active", async () => {
      sendSpy.mockResolvedValueOnce({ Status: "Enabled" });
      const status = await service.getBucketVersioning("test-bucket");
      expect(sendSpy).toHaveBeenCalledWith(expect.any(GetBucketVersioningCommand));
      expect(status).toBe("Enabled");
    });

    it("returns 'Disabled' when no status returned", async () => {
      sendSpy.mockResolvedValueOnce({});
      const status = await service.getBucketVersioning("test-bucket");
      expect(status).toBe("Disabled");
    });
  });

  describe("setBucketVersioning", () => {
    it("sends PutBucketVersioningCommand with specified status", async () => {
      sendSpy.mockResolvedValueOnce({});
      await service.setBucketVersioning("test-bucket", "Suspended");
      expect(sendSpy).toHaveBeenCalledWith(expect.any(PutBucketVersioningCommand));
    });
  });

  describe("getBucketLifecycle", () => {
    it("returns parsed lifecycle rules", async () => {
      sendSpy.mockResolvedValueOnce({
        Rules: [
          {
            ID: "archive-rule",
            Status: "Enabled",
            Filter: { Prefix: "logs/" },
            Transitions: [{ Days: 30, StorageClass: "GLACIER" }],
            Expiration: { Days: 90 },
          },
        ],
      });

      const rules = await service.getBucketLifecycle("test-bucket");
      expect(sendSpy).toHaveBeenCalledWith(expect.any(GetBucketLifecycleConfigurationCommand));
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe("archive-rule");
      expect(rules[0].prefix).toBe("logs/");
      expect(rules[0].transitions?.[0].days).toBe(30);
    });

    it("returns empty array when NoSuchLifecycleConfiguration 404 is thrown", async () => {
      const err: any = new Error("NoSuchLifecycleConfiguration");
      err.name = "NoSuchLifecycleConfiguration";
      sendSpy.mockRejectedValueOnce(err);

      const rules = await service.getBucketLifecycle("test-bucket");
      expect(rules).toEqual([]);
    });
  });

  describe("getBucketCors", () => {
    it("returns parsed CORS rules", async () => {
      sendSpy.mockResolvedValueOnce({
        CORSRules: [
          {
            AllowedOrigins: ["*"],
            AllowedMethods: ["GET", "PUT"],
            AllowedHeaders: ["*"],
          },
        ],
      });

      const rules = await service.getBucketCors("test-bucket");
      expect(sendSpy).toHaveBeenCalledWith(expect.any(GetBucketCorsCommand));
      expect(rules).toHaveLength(1);
      expect(rules[0].allowedOrigins).toEqual(["*"]);
    });
  });
});
