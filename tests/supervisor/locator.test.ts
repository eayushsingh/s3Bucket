import { describe, it, expect } from "vitest";
import { findNativeMinIOBinary } from "../../storage/minio-locator";

describe("MinIO Binary Locator Suite", () => {
  it("should either return null or an executable path string", () => {
    const binary = findNativeMinIOBinary();
    if (binary !== null) {
      expect(typeof binary).toBe("string");
      expect(binary.length).toBeGreaterThan(0);
      expect(binary.includes("minio")).toBe(true);
    } else {
      expect(binary).toBeNull();
    }
  });
});
