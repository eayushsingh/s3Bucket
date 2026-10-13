import { probeMinIOHealthEndpoint, isTcpPortOpen } from "../storage/minio-probes";
import { findNativeMinIOBinary } from "../storage/minio-locator";
import { isDockerDaemonAvailable, isMinIODockerContainerRunning } from "../storage/minio-docker";
import { loadStorageConfig } from "../storage/storage.config";

async function main() {
  console.log("==========================================");
  console.log("MinIO S3 Storage Infrastructure Diagnostic");
  console.log("==========================================");

  const config = loadStorageConfig();
  console.log(`Configured Endpoint: ${config.endpoint}`);
  console.log(`Configured Region:   ${config.region}`);

  const portOpen = await isTcpPortOpen(9000);
  console.log(`Port 9000 Open:      ${portOpen ? "YES" : "NO"}`);

  const probe = await probeMinIOHealthEndpoint(config.endpoint);
  console.log(`HTTP Health Probe:   ${probe.reachable ? "REACHABLE" : "UNREACHABLE"} (${probe.latencyMs}ms)`);

  const nativeBin = findNativeMinIOBinary();
  console.log(`Native Binary Found: ${nativeBin || "NONE"}`);

  const dockerAvail = isDockerDaemonAvailable();
  console.log(`Docker Daemon:       ${dockerAvail ? "AVAILABLE" : "OFFLINE"}`);

  if (dockerAvail) {
    const containerRunning = isMinIODockerContainerRunning();
    console.log(`Docker Container:    ${containerRunning ? "RUNNING" : "STOPPED"}`);
  }

  console.log("==========================================\n");
}

main().catch(console.error);
