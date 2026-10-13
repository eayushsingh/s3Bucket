import { describe, it, expect } from "vitest";
import { isConnectionRefusalError, executeWithResilience } from "../../storage/storage-resilience";

describe("Storage Resilience Suite", () => {
  it("should classify ECONNREFUSED correctly", () => {
    const connErr = new Error("connect ECONNREFUSED 127.0.0.1:9000");
    (connErr as any).code = "ECONNREFUSED";
    expect(isConnectionRefusalError(connErr)).toBe(true);
  });

  it("should classify non-connection errors as false", () => {
    const valErr = new Error("Invalid bucket name format");
    expect(isConnectionRefusalError(valErr)).toBe(false);
  });

  it("should pass through successfully when operation succeeds", async () => {
    const result = await executeWithResilience(async () => {
      return { success: true, count: 42 };
    });
    expect(result.success).toBe(true);
    expect(result.count).toBe(42);
  });
});
