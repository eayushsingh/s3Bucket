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

