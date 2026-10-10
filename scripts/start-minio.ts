import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";

async function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/minio/health/live`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 403 || res.statusCode === 400);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log("Checking MinIO Storage status...");
  const alreadyRunning = await isPortOpen(9000);

  if (alreadyRunning) {
    console.log("MinIO is already running on http://127.0.0.1:9000");
    execSync("npm run init:storage", { stdio: "inherit" });
    return;
  }

  // Try starting via Docker Compose first
  let startedWithDocker = false;
  try {
    console.log("Attempting to start MinIO via Docker Compose...");
    execSync("docker compose up -d", { stdio: "inherit", timeout: 10000 });
    startedWithDocker = true;
  } catch (e: any) {
    console.log("Docker daemon not available or failed. Falling back to native MinIO engine...");
  }

  if (!startedWithDocker) {
    // Native MinIO binary fallback
    const dataDir = path.join(process.cwd(), "minio_data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const minioBin = execSync("which minio || echo ''").toString().trim();
    if (!minioBin) {
      console.error(
        "\n[ERROR] MinIO binary not found and Docker is not running.\n" +
        "Please start Docker Desktop or install MinIO via: brew install minio\n"
      );
      process.exit(1);
    }

    console.log(`Starting native MinIO server on ports 9000 & 9001 using ${minioBin}...`);
    const minioProcess = spawn(
      minioBin,
      ["server", dataDir, "--console-address", ":9001", "--address", ":9000"],
      {
        env: {
          ...process.env,
          MINIO_ROOT_USER: process.env.STORAGE_ACCESS_KEY || "minioadmin",
          MINIO_ROOT_PASSWORD: process.env.STORAGE_SECRET_KEY || "minioadmin_secure_password_123",
          MINIO_BROWSER_REDIRECT_URL: "http://127.0.0.1:9001",
        },
        detached: true,
        stdio: "ignore",
      }
    );

    minioProcess.unref();

    // Wait for MinIO to become reachable
    console.log("Waiting for MinIO engine to initialize...");
    let retries = 20;
    while (retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isPortOpen(9000)) {
        break;
      }
      retries--;
    }
  }

  // Idempotently create buckets
  execSync("npm run init:storage", { stdio: "inherit" });
  console.log("\n========================================================");
  console.log("MinIO S3 Engine is READY!");
  console.log("S3 API:     http://127.0.0.1:9000");
  console.log("Console UI: http://127.0.0.1:9001");
  console.log("========================================================\n");
}

main().catch(console.error);
