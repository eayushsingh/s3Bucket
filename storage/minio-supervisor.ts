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

/**
 * Executes full auto-detection and autonomous recovery of the MinIO engine.
 */
async function performMinIOAutoRecovery(): Promise<{
  ready: boolean;
  mode: StorageEngineMode;
  message: string;
}> {
  const config = loadStorageConfig();
  const url = new URL(config.endpoint);
  const port = parseInt(url.port || "9000", 10);
  const host = url.hostname || "127.0.0.1";

  // 1. Is MinIO already alive?
  const portOpen = await isTcpPortOpen(port, host, 600);
  if (portOpen) {
    const probe = await probeMinIOHealthEndpoint(config.endpoint, 1000);
    if (probe.reachable) {
      lastSupervisorStatus = {
        active: true,
        mode: "already_running",
        endpoint: config.endpoint,
        lastCheckTimestamp: new Date().toISOString(),
        message: `MinIO S3 storage active on ${config.endpoint}`,
      };
      return { ready: true, mode: "already_running", message: lastSupervisorStatus.message };
    }
  }

  // 2. Try native binary fallback first (faster and works without Docker daemon)
  const nativeBinary = findNativeMinIOBinary();
  if (nativeBinary) {
    console.log(`[Supervisor] Spawning native MinIO engine via ${nativeBinary}...`);
    const spawnRes = spawnNativeMinIOServer({
      port,
      consolePort: 9001,
      rootUser: config.accessKeyId,
      rootPassword: config.secretAccessKey,
    });

    if (spawnRes.success) {
      const ready = await waitForMinIOReadiness({ port, host, endpoint: config.endpoint });
      if (ready) {
        lastSupervisorStatus = {
          active: true,
          mode: "spawned_native",
          endpoint: config.endpoint,
          pid: spawnRes.pid,
          lastCheckTimestamp: new Date().toISOString(),
          message: `Spawned native MinIO process (PID: ${spawnRes.pid}) on ${config.endpoint}`,
        };
        console.log(`[Supervisor] ${lastSupervisorStatus.message}`);
        return { ready: true, mode: "spawned_native", message: lastSupervisorStatus.message };
      }
    }
  }

  // 3. Try Docker if daemon is active
  if (isDockerDaemonAvailable()) {
    console.log("[Supervisor] Docker daemon is available. Starting container via docker compose...");
    const dockerStarted = startMinIOViaDocker();
    if (dockerStarted) {
      const ready = await waitForMinIOReadiness({ port, host, endpoint: config.endpoint });
      if (ready) {
        lastSupervisorStatus = {
          active: true,
          mode: "started_docker",
          endpoint: config.endpoint,
          lastCheckTimestamp: new Date().toISOString(),
          message: `Started MinIO container in Docker on ${config.endpoint}`,
        };
        return { ready: true, mode: "started_docker", message: lastSupervisorStatus.message };
      }
    }
  }

  // 4. Could not connect and could not start
  lastSupervisorStatus = {
    active: false,
    mode: "unreachable",
    endpoint: config.endpoint,
    lastCheckTimestamp: new Date().toISOString(),
    message: `Unable to connect to MinIO on ${config.endpoint} or spawn background engine`,
  };
  return { ready: false, mode: "unreachable", message: lastSupervisorStatus.message };
}

/**
 * Main public entry point to ensure the MinIO storage engine is running.
 * Coalesces concurrent calls to prevent multiple processes being launched.
 */
export async function ensureMinIOEngineRunning(): Promise<{
  ready: boolean;
  mode: StorageEngineMode;
  message: string;
}> {
  if (activeRecoveryPromise) {
    return activeRecoveryPromise;
  }

  activeRecoveryPromise = performMinIOAutoRecovery().finally(() => {
    activeRecoveryPromise = null;
  });

  return activeRecoveryPromise;
}


