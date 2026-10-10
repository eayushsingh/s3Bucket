import { S3AuditEvent } from "./storage.types";

/**
 * Enterprise In-Memory S3 Operational Audit Logger
 * Maintains an operational ledger of S3 API interactions with millisecond telemetry.
 */
class AuditService {
  private static instance: AuditService;
  private readonly MAX_EVENTS = 500;
  private events: S3AuditEvent[] = [];

  private constructor() {
    // Seed with baseline cluster initialization event
    this.record({
      operation: "SYSTEM_INITIALIZE",
      statusCode: 200,
      latencyMs: 1,
      details: { engine: "MinIO S3 Compatible Subsystem", mode: "ENTERPRISE_PRODUCTION" },
    });
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public record(event: Omit<S3AuditEvent, "id" | "timestamp">): S3AuditEvent {
    const fullEvent: S3AuditEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.events.unshift(fullEvent);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.pop();
    }

    return fullEvent;
  }

  public getEvents(options?: {
    bucket?: string;
    operation?: string;
    limit?: number;
    since?: string;
  }): S3AuditEvent[] {
    let result = this.events;

    if (options?.bucket) {
      result = result.filter((e) => e.bucket === options.bucket);
    }

    if (options?.operation) {
      result = result.filter((e) =>
        e.operation.toLowerCase().includes(options.operation!.toLowerCase())
      );
    }

    if (options?.since) {
      const sinceDate = new Date(options.since).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() > sinceDate);
    }

    const limit = options?.limit ?? 100;
    return result.slice(0, limit);
  }

  public clear(): void {
    this.events = [];
  }
}

export const auditService = AuditService.getInstance();
