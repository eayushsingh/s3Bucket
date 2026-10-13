import { execSync } from "child_process";

/**
 * Checks whether the Docker daemon is responsive without hanging.
 */
export function isDockerDaemonAvailable(): boolean {
  try {
    execSync("docker info --format '{{.ServerVersion}}'", {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2500,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if the s3_minio_server container is currently running.
 */
export function isMinIODockerContainerRunning(): boolean {
  if (!isDockerDaemonAvailable()) return false;
  try {
    const out = execSync("docker ps --filter 'name=s3_minio_server' --format '{{.Names}}'", {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2500,
    })
      .toString()
      .trim();
    return out.includes("s3_minio_server");
  } catch {
    return false;
  }
}

/**
 * Attempts to launch MinIO using docker compose up -d.
 */
export function startMinIOViaDocker(): boolean {
  if (!isDockerDaemonAvailable()) return false;
  try {
    execSync("docker compose up -d minio", {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 8000,
    });
    return true;
  } catch {
    return false;
  }
}
