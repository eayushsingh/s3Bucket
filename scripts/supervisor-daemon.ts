import { ensureMinIOEngineRunning } from "../storage/minio-supervisor";
import { isTcpPortOpen } from "../storage/minio-probes";

async function runDaemonLoop() {
  console.log("[Storage Supervisor Daemon] Starting heartbeat watchdog...");
  let intervalMs = 5000;

  while (true) {
    try {
      const isAlive = await isTcpPortOpen(9000, "127.0.0.1", 1000);
      if (!isAlive) {
        console.warn("[Storage Watchdog] MinIO port 9000 unresponsive. Triggering autonomous recovery...");
        const result = await ensureMinIOEngineRunning();
        console.log(`[Storage Watchdog] Recovery result: ${result.mode} - ${result.message}`);
      }
    } catch (err: any) {
      console.error("[Storage Watchdog] Error in health probe loop:", err.message);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

runDaemonLoop().catch(console.error);
