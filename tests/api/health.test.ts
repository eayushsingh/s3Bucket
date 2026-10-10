import { describe, it, expect } from "vitest";
import { GET } from "../../app/api/health/storage/route";

describe("Health Route API Handler (/api/health/storage)", () => {
  it("should return version and architecture metadata along with health status", async () => {
    const response = await GET();
    expect([200, 503]).toContain(response.status);

    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.version).toBe("1.2.0");
    expect(body.data.architecture).toBe("Zero-RAM-Proxy");
    expect(body.data.stackEndpoint).toBe("/api/system/stack");

    expect(response.headers.get("X-Application-Version")).toBe("1.2.0");
    expect(response.headers.get("X-Storage-Engine")).toBe("AWS-SDK-v3/MinIO");
    expect(response.headers.get("X-Audit-Ledger")).toBe("SQLite-WAL");
  });
});
