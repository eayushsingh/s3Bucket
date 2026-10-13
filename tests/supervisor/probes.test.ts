import { describe, it, expect } from "vitest";
import { isTcpPortOpen, probeMinIOHealthEndpoint } from "../../storage/minio-probes";

describe("MinIO Probes Suite", () => {
  it("should return false for unopened random port", async () => {
    // Port 59999 should not be listening
    const isOpen = await isTcpPortOpen(59999, "127.0.0.1", 200);
    expect(isOpen).toBe(false);
  });

  it("should probe health endpoint with valid object shape", async () => {
    const probe = await probeMinIOHealthEndpoint("http://127.0.0.1:59999", 200);
    expect(probe).toHaveProperty("reachable");
    expect(probe).toHaveProperty("latencyMs");
    expect(typeof probe.reachable).toBe("boolean");
    expect(typeof probe.latencyMs).toBe("number");
  });
});
