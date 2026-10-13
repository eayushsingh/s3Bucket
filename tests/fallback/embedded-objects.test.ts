import { describe, it, expect, afterAll } from "vitest";
import { EmbeddedStorageEngine } from "../../storage/embedded-storage.engine";
import fs from "fs";
import path from "path";

const TEST_DIR = path.join(process.cwd(), "tests_scratch_fallback_3");
const engine = new EmbeddedStorageEngine({ baseDirectory: TEST_DIR });

afterAll(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe("Embedded Storage Object Operations Suite", () => {
  const bucket = "object-test-bucket";

  it("should persist, get, list and delete objects", async () => {
    await engine.createBucket(bucket);

    const payload = Buffer.from("Hello Embedded Storage Engine!");
    const putRes = await engine.putObject({
      bucket,
      key: "docs/readme.txt",
      body: payload,
      contentType: "text/plain",
    });

    expect(putRes.key).toBe("docs/readme.txt");
    expect(putRes.size).toBe(payload.length);

    // Get object
    const getRes = await engine.getObject(bucket, "docs/readme.txt");
    expect(getRes.body.toString()).toBe("Hello Embedded Storage Engine!");
    expect(getRes.contentType).toBe("text/plain");

    // List objects
    const listRes = await engine.listObjects(bucket);
    expect(listRes.objects.length).toBe(1);
    expect(listRes.objects[0].key).toBe("docs/readme.txt");

    // Metrics
    const metrics = await engine.getBucketMetrics(bucket);
    expect(metrics.objectCount).toBe(1);
    expect(metrics.totalSizeBytes).toBe(payload.length);

    // Delete object
    await engine.deleteObject(bucket, "docs/readme.txt");
    const afterList = await engine.listObjects(bucket);
    expect(afterList.objects.length).toBe(0);
  });
});
