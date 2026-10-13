/**
 * Classification of storage connection errors and recovery policies.
 */

export enum ConnectionRecoveryStrategy {
  RETRY_WITH_SUPERVISOR = "RETRY_WITH_SUPERVISOR",
  FALLBACK_TO_EMBEDDED = "FALLBACK_TO_EMBEDDED",
  TERMINAL_FAILURE = "TERMINAL_FAILURE",
}

/**
 * Checks whether an error signifies that the MinIO/S3 daemon refused connection.
 */
export function isConnectionRefusalError(err: any): boolean {
  if (!err) return false;

  const code = err.code || err.name || "";
  const message = String(err.message || "").toLowerCase();

  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "NetworkingError" ||
    message.includes("econnrefused") ||
    message.includes("connect econnrefused") ||
    message.includes("failed to connect to minio/s3 endpoint") ||
    message.includes("fetch failed")
  );
}

export interface AutoRecoveryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  operationName?: string;
  enableFallback?: boolean;
}

export interface RecoveryMetrics {
  totalAttempts: number;
  successfulRecoveries: number;
  fallbacksTriggered: number;
}

export const recoveryMetrics: RecoveryMetrics = {
  totalAttempts: 0,
  successfulRecoveries: 0,
  fallbacksTriggered: 0,
};

/**
 * Attempts recovery by requesting the MinIO supervisor to spawn/verify the engine.
 */
export async function attemptSupervisorRecovery(): Promise<boolean> {
  const { ensureMinIOEngineRunning } = await import("./minio-supervisor");
  const { resetS3Client } = await import("./minio.client");

  recoveryMetrics.totalAttempts++;
  const result = await ensureMinIOEngineRunning();
  if (result.ready) {
    resetS3Client();
    recoveryMetrics.successfulRecoveries++;
    return true;
  }
  return false;
}

/**
 * Executes an arbitrary storage operation with automatic detection of connection refusal,
 * autonomous engine recovery via supervisor, and seamless request retry.
 */
export async function executeWithResilience<T>(
  operation: () => Promise<T>,
  options: AutoRecoveryOptions = {}
): Promise<T> {
  try {
    return await operation();
  } catch (err: any) {
    if (isConnectionRefusalError(err)) {
      console.warn(
        `[Storage Resilience] Connection refused during ${options.operationName || "storage operation"}. Initiating auto-recovery...`
      );

      const recovered = await attemptSupervisorRecovery();
      if (recovered) {
        console.log("[Storage Resilience] Engine recovered successfully! Retrying operation...");
        // Give socket a tiny pause to accept connections
        await new Promise((r) => setTimeout(r, 200));
        return await operation();
      }
    }
    throw err;
  }
}



