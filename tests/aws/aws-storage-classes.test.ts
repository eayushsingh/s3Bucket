import { describe, it, expect } from "vitest";
import { AWS_STORAGE_CLASSES } from "../../components/aws/aws.constants";

describe("AWS S3 Storage Classes Specification", () => {
  it("should define standard, glacier, and deep archive storage classes", () => {
    const values = AWS_STORAGE_CLASSES.map((s) => s.value);
    expect(values).toContain("STANDARD");
    expect(values).toContain("GLACIER");
    expect(values).toContain("DEEP_ARCHIVE");
  });

  it("should guarantee 11 9s durability across all storage class tiers", () => {
    for (const sc of AWS_STORAGE_CLASSES) {
      expect(sc.durability).toContain("99.999999999%");
    }
  });
});
