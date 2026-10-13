import { isTcpPortOpen, probeMinIOHealthEndpoint } from "./minio-probes";

export interface WaiterOptions {
  port?: number;
  host?: string;
  endpoint?: string;
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

/**
 * Utility function to sleep for ms.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
