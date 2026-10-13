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

/**
 * Polls the port and HTTP health endpoint until MinIO is ready or max retries reached.
 */
export async function waitForMinIOReadiness(options: WaiterOptions = {}): Promise<boolean> {
  const port = options.port || 9000;
  const host = options.host || "127.0.0.1";
  const endpoint = options.endpoint || `http://${host}:${port}`;
  const maxRetries = options.maxRetries || 25;
  const initialDelay = options.initialDelayMs || 100;
  const maxDelay = options.maxDelayMs || 500;
  const backoff = options.backoffFactor || 1.3;

  let currentDelay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    const tcpOpen = await isTcpPortOpen(port, host, 600);
    if (tcpOpen) {
      const probe = await probeMinIOHealthEndpoint(endpoint, 1000);
      if (probe.reachable) {
        return true;
      }
    }

    await sleep(currentDelay);
    currentDelay = Math.min(Math.round(currentDelay * backoff), maxDelay);
  }

  // Final check
  return isTcpPortOpen(port, host, 800);
}

