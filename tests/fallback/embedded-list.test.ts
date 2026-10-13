import { describe, it, expect, afterAll } from "vitest";
import { EmbeddedStorageEngine } from "../../storage/embedded-storage.engine";
import fs from "fs";
import path from "path";

const TEST_DIR = path.join(process.cwd(), "tests_scratch_fallback_2");
const engine = new EmbeddedStorageEngine({ baseDirectory: TEST_DIR });

afterAll(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe("Embedded Storage Bucket Listing Suite", () => {
  it("should list newly created buckets accurately", async () => {
    await engine.createBucket("list-bucket-alpha");
    await engine.createBucket("list-bucket-beta");

    const buckets = await engine.listBuckets();
    const names = buckets.map((b) => b.name);

    expect(names).toContain("list-bucket-alpha");
    expect(names).toContain("list-bucket-beta");
  });

  it("should support deleting buckets", async () => {
    await engine.deleteBucket("list-bucket-alpha", true);
    expect(await engine.bucketExists("list-bucket-alpha")).toBe(false);
  });
});
