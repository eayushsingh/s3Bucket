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
