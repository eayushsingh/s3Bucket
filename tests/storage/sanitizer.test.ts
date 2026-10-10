import { describe, it, expect } from "vitest";
import {
  validateBucketName,
  validateObjectKey,
  sanitizeFileName,
  generateSafeObjectKey,
} from "@/storage/sanitizer";
import { InvalidBucketNameError, InvalidObjectKeyError } from "@/storage/storage.errors";

describe("Sanitizer & Security Validation", () => {
  describe("validateBucketName", () => {
    it("accepts standard valid bucket names", () => {
      expect(() => validateBucketName("my-app-bucket")).not.toThrow();
      expect(() => validateBucketName("app.uploads.2026")).not.toThrow();
      expect(() => validateBucketName("photos-123-abc")).not.toThrow();
    });

    it("rejects bucket names with uppercase characters", () => {
      expect(() => validateBucketName("MyBucket")).toThrow(InvalidBucketNameError);
    });

    it("rejects bucket names shorter than 3 characters or longer than 63", () => {
      expect(() => validateBucketName("ab")).toThrow(InvalidBucketNameError);
      expect(() => validateBucketName("a".repeat(64))).toThrow(InvalidBucketNameError);
    });

    it("rejects bucket names with consecutive periods or invalid start/end", () => {
      expect(() => validateBucketName("my..bucket")).toThrow(InvalidBucketNameError);
      expect(() => validateBucketName("-leading-hyphen")).toThrow(InvalidBucketNameError);
      expect(() => validateBucketName("trailing-hyphen-")).toThrow(InvalidBucketNameError);
    });

    it("rejects IP address formatted bucket names", () => {
      expect(() => validateBucketName("192.168.1.1")).toThrow(InvalidBucketNameError);
    });
  });

  describe("validateObjectKey", () => {
    it("accepts valid keys and normalizes slashes", () => {
      expect(validateObjectKey("documents/reports/q1.pdf")).toBe("documents/reports/q1.pdf");
      expect(validateObjectKey("/leading/slash/image.png")).toBe("leading/slash/image.png");
      expect(validateObjectKey("windows\\style\\path.txt")).toBe("windows/style/path.txt");
    });

    it("blocks directory traversal attacks (../)", () => {
      expect(() => validateObjectKey("../secret.pem")).toThrow(InvalidObjectKeyError);
      expect(() => validateObjectKey("uploads/../../etc/passwd")).toThrow(InvalidObjectKeyError);
    });

    it("blocks null byte injection attacks", () => {
      expect(() => validateObjectKey("malicious.png\0.exe")).toThrow(InvalidObjectKeyError);
    });

    it("rejects empty or root-only keys", () => {
      expect(() => validateObjectKey("")).toThrow(InvalidObjectKeyError);
      expect(() => validateObjectKey("///")).toThrow(InvalidObjectKeyError);
    });
  });

  describe("sanitizeFileName", () => {
    it("strips hazardous characters while preserving extensions", () => {
      expect(sanitizeFileName("my cool file (1).png")).toBe("my_cool_file_1_.png");
      expect(sanitizeFileName("../../etc/hosts")).toBe("hosts");
      expect(sanitizeFileName("report;rm -rf ;.pdf")).toBe("report_rm_-rf_.pdf");
    });
  });

  describe("generateSafeObjectKey", () => {
    it("generates structured collision-resistant keys", () => {
      const key = generateSafeObjectKey({
        originalFileName: "profile picture.jpg",
        prefix: "avatars",
        userId: "42",
        includeDatePrefix: true,
      });

      expect(key).toMatch(/^avatars\/user_42\/\d{4}\/\d{2}\/\d{2}\/[a-f0-9-]+-profile_picture\.jpg$/);
    });
  });
});
