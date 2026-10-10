import { describe, it, expect } from "vitest";
import { GET } from "../../app/api/system/stack/route";

describe("System Stack API Handler (/api/system/stack)", () => {
  it("should return a successful HTTP 200 response with system stack payload", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    // Application details
    expect(body.data.application.name).toContain("AWS S3");
    expect(body.data.application.version).toBe("1.2.0");

    // Libraries & categories
    expect(Array.isArray(body.data.libraries)).toBe(true);
    expect(body.data.libraries.length).toBeGreaterThanOrEqual(10);
    expect(Array.isArray(body.data.categories)).toBe(true);
    expect(body.data.summary.totalLibraries).toBe(body.data.libraries.length);

    // Runtime specs
    expect(body.data.runtime).toBeDefined();
    expect(body.data.runtime.nodeVersion.startsWith("v")).toBe(true);
    expect(body.data.runtime.memory.rssBytes).toBeGreaterThan(0);
    expect(body.data.runtime.storageBackend.provider).toContain("MinIO");
  });

  it("should include no-store Cache-Control headers for live runtime freshness", async () => {
    const response = await GET();
    const cacheHeader = response.headers.get("Cache-Control");
    expect(cacheHeader).toContain("no-store");
  });
});
