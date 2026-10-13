import {
  StorageEngineMode,
  SupervisorStatus,
} from "./minio-supervisor.types";
import { isTcpPortOpen, probeMinIOHealthEndpoint } from "./minio-probes";
import { findNativeMinIOBinary } from "./minio-locator";
import { isDockerDaemonAvailable, startMinIOViaDocker } from "./minio-docker";
import { spawnNativeMinIOServer } from "./minio-process";
import { waitForMinIOReadiness } from "./minio-waiter";
import { loadStorageConfig } from "./storage.config";

let lastSupervisorStatus: SupervisorStatus | null = null;
let activeRecoveryPromise: Promise<{ ready: boolean; mode: StorageEngineMode; message: string }> | null = null;

export function getCachedSupervisorStatus(): SupervisorStatus | null {
  return lastSupervisorStatus;
}
