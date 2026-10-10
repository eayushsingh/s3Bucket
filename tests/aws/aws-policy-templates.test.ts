import { describe, it, expect } from "vitest";
import { getDefaultBucketPolicy, DEFAULT_CORS_CONFIG } from "../../components/aws/aws.constants";

describe("AWS S3 Policy and CORS Generator", () => {
  it("should generate valid JSON policy with correct S3 ARN resource", () => {
    const policyStr = getDefaultBucketPolicy("production-data");
    const parsed = JSON.parse(policyStr);
    expect(parsed.Statement[0].Resource[0]).toBe("arn:aws:s3:::production-data/*");
  });

  it("should generate valid CORS configuration with standard HTTP methods", () => {
    const cors = JSON.parse(DEFAULT_CORS_CONFIG);
    expect(Array.isArray(cors)).toBe(true);
    expect(cors[0].AllowedMethods).toContain("GET");
    expect(cors[0].AllowedMethods).toContain("PUT");
  });
});
