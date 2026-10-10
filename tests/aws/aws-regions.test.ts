import { describe, it, expect } from "vitest";
import { AWS_REGIONS } from "../../components/aws/aws.constants";

describe("AWS Regions Specification", () => {
  it("should contain standard US, Europe, and Asia Pacific regions", () => {
    const ids = AWS_REGIONS.map((r) => r.id);
    expect(ids).toContain("us-east-1");
    expect(ids).toContain("eu-west-1");
    expect(ids).toContain("ap-northeast-1");
  });

  it("should have exactly one default region", () => {
    const defaultRegions = AWS_REGIONS.filter((r) => r.isDefault);
    expect(defaultRegions.length).toBe(1);
    expect(defaultRegions[0].id).toBe("us-east-1");
  });
});
