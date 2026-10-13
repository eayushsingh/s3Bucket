import { describe, it, expect, afterAll } from "vitest";
import { EmbeddedStorageEngine } from "../../storage/embedded-storage.engine";
import fs from "fs";
import path from "path";

const TEST_DIR = path.join(process.cwd(), "tests_scratch_fallback_1");
const engine = new EmbeddedStorageEngine({ baseDirectory: TEST_DIR });

afterAll(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe("Embedded Storage Bucket Creation Suite", () => {
  it("should create a new bucket directory on disk", async () => {
    const res = await engine.createBucket("test-autofallback-bucket");
    expect(res.created).toBe(true);
    expect(res.name).toBe("test-autofallback-bucket");
    expect(await engine.bucketExists("test-autofallback-bucket")).toBe(true);
  });

  it("should be idempotent when creating already existing bucket", async () => {
    const res = await engine.createBucket("test-autofallback-bucket");
    expect(res.created).toBe(false);
    expect(res.name).toBe("test-autofallback-bucket");
  });
});
