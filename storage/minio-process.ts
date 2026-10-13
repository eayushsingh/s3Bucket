import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { findNativeMinIOBinary } from "./minio-locator";

let supervisedProcess: ChildProcess | null = null;

export interface SpawnOptions {
  dataDir?: string;
  port?: number;
  consolePort?: number;
  rootUser?: string;
  rootPassword?: string;
}

/**
 * Ensures target data directory exists on disk.
 */
export function ensureDataDirectory(targetDir: string): string {
  const resolved = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(process.cwd(), targetDir);

  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  return resolved;
}

/**
 * Spawns the native MinIO binary in detached mode.
 */
export function spawnNativeMinIOServer(options: SpawnOptions = {}): {
  success: boolean;
  pid?: number;
  binaryPath?: string;
  error?: string;
} {
  const binary = findNativeMinIOBinary();
  if (!binary) {
    return { success: false, error: "MinIO binary not found on system" };
  }

  const dataDir = ensureDataDirectory(options.dataDir || "minio_data");
  const port = options.port || 9000;
  const consolePort = options.consolePort || 9001;
  const user = options.rootUser || process.env.STORAGE_ACCESS_KEY || "minioadmin";
  const pass = options.rootPassword || process.env.STORAGE_SECRET_KEY || "minioadmin_secure_password_123";

  try {
    const child = spawn(
      binary,
      [
        "server",
        dataDir,
        "--address",
        `:${port}`,
        "--console-address",
        `:${consolePort}`,
      ],
      {
        env: {
          ...process.env,
          MINIO_ROOT_USER: user,
          MINIO_ROOT_PASSWORD: pass,
          MINIO_BROWSER_REDIRECT_URL: `http://127.0.0.1:${consolePort}`,
        },
        detached: true,
        stdio: "ignore",
      }
    );

    child.unref();
    supervisedProcess = child;

    return {
      success: true,
      pid: child.pid,
      binaryPath: binary,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export function getSupervisedProcess(): ChildProcess | null {
  return supervisedProcess;
}

