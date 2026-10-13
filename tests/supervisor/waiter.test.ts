import { describe, it, expect } from "vitest";
import { waitForMinIOReadiness, sleep } from "../../storage/minio-waiter";

describe("MinIO Waiter Suite", () => {
  it("should sleep for the specified duration", async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it("should terminate gracefully and return false when target port is unreachable", async () => {
    const ready = await waitForMinIOReadiness({
      port: 59998,
      maxRetries: 2,
      initialDelayMs: 20,
    });
    expect(ready).toBe(false);
  });
});
