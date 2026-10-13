/**
 * Types and interfaces for the autonomous MinIO Storage Supervisor.
 */

export type StorageEngineMode =
  | "already_running"
  | "spawned_native"
  | "started_docker"
  | "fallback_embedded"
  | "unreachable";

export interface SupervisorConfig {
  endpoint: string;
  port: number;
  dataDir: string;
  maxRetries: number;
  retryDelayMs: number;
  rootUser: string;
  rootPassword: string;
  consolePort: number;
}

export interface StorageProbeResult {
  reachable: boolean;
  statusCode?: number;
  latencyMs?: number;
  error?: string;
}

export interface SupervisorStatus {
  active: boolean;
  mode: StorageEngineMode;
  endpoint: string;
  pid?: number;
  lastCheckTimestamp: string;
  message: string;
}
