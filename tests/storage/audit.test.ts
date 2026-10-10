import { describe, it, expect, beforeEach } from "vitest";
import { auditService } from "@/storage/audit.service";

describe("AuditService (S3 Operational Ledger)", () => {
  beforeEach(() => {
    auditService.clear();
  });

  it("records operational events with auto-generated id and timestamp", () => {
    const event = auditService.record({
      operation: "PutObject",
      bucket: "telemetry-bucket",
      objectKey: "logs/sys.log",
      statusCode: 200,
      latencyMs: 14,
      details: { sizeBytes: 1024 },
    });

    expect(event.id).toMatch(/^evt_\d+_/);
    expect(event.timestamp).toBeDefined();
    expect(event.operation).toBe("PutObject");
    expect(event.statusCode).toBe(200);
  });

  it("filters events by bucket", () => {
    auditService.record({
      operation: "PutObject",
      bucket: "bucket-a",
      statusCode: 200,
      latencyMs: 10,
    });
    auditService.record({
      operation: "PutObject",
      bucket: "bucket-b",
      statusCode: 200,
      latencyMs: 12,
    });

    const bucketAEvents = auditService.getEvents({ bucket: "bucket-a" });
    expect(bucketAEvents).toHaveLength(1);
    expect(bucketAEvents[0].bucket).toBe("bucket-a");
  });

  it("filters events by operation pattern", () => {
    auditService.record({
      operation: "PutObject",
      bucket: "bucket-a",
      statusCode: 200,
      latencyMs: 10,
    });
    auditService.record({
      operation: "DeleteObject",
      bucket: "bucket-a",
      statusCode: 204,
      latencyMs: 8,
    });

    const deleteEvents = auditService.getEvents({ operation: "delete" });
    expect(deleteEvents).toHaveLength(1);
    expect(deleteEvents[0].operation).toBe("DeleteObject");
  });

  it("limits number of returned events", () => {
    for (let i = 0; i < 20; i++) {
      auditService.record({
        operation: `Op${i}`,
        statusCode: 200,
        latencyMs: i,
      });
    }

    const limited = auditService.getEvents({ limit: 5 });
    expect(limited).toHaveLength(5);
  });
});
