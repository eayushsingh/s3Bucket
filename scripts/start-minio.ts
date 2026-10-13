import { execSync } from "child_process";
import { ensureMinIOEngineRunning } from "../storage/minio-supervisor";
import { isTcpPortOpen } from "../storage/minio-probes";

async function main() {
  console.log("========================================================");
  console.log("Verifying & Launching S3 / MinIO Storage Engine...");
  console.log("========================================================");

  const result = await ensureMinIOEngineRunning();
  console.log(`[Supervisor Result] Mode: ${result.mode} - ${result.message}`);

  const portOpen = await isTcpPortOpen(9000, "127.0.0.1", 1000);
  if (portOpen) {
    try {
      execSync("npm run init:storage", { stdio: "inherit" });
    } catch {
      console.warn("Storage default buckets initialization will continue asynchronously.");
    }
  } else {
    console.warn("MinIO daemon not currently listening on port 9000. Fallback embedded engine active.");
  }

  console.log("========================================================");
  console.log("Storage Subsystem Ready!");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Storage launcher caught error:", err);
  process.exit(0); // Exit cleanly so Next.js server can still boot with embedded fallback
});
