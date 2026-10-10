import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { FileRecord } from "../storage/storage.types";

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.DATABASE_PATH || "./data/metadata.sqlite";
  const absolutePath = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(process.cwd(), dbPath);

  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new Database(absolutePath);
  dbInstance.pragma("journal_mode = WAL");

  // Create table schema
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS file_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bucket TEXT NOT NULL,
      object_key TEXT NOT NULL UNIQUE,
      original_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      etag TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'uploaded', 'deleted', 'failed')),
      custom_metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_file_records_bucket ON file_records(bucket);
    CREATE INDEX IF NOT EXISTS idx_file_records_user ON file_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_file_records_status ON file_records(status);
  `);

  return dbInstance;
}

export function saveFileRecord(record: {
  id: string;
  userId: string;
  bucket: string;
  objectKey: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  etag?: string;
  status: "pending" | "uploaded" | "deleted" | "failed";
  customMetadata?: Record<string, any>;
}): FileRecord {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO file_records (
      id, user_id, bucket, object_key, original_filename, mime_type, size, etag, status, custom_metadata, created_at, updated_at
    ) VALUES (
      @id, @userId, @bucket, @objectKey, @originalFileName, @mimeType, @size, @etag, @status, @customMetadata, @createdAt, @updatedAt
    )
    ON CONFLICT(object_key) DO UPDATE SET
      user_id = excluded.user_id,
      original_filename = excluded.original_filename,
      mime_type = excluded.mime_type,
      size = excluded.size,
      etag = excluded.etag,
      status = excluded.status,
      custom_metadata = excluded.custom_metadata,
      updated_at = excluded.updated_at
  `);

  stmt.run({
    id: record.id,
    userId: record.userId,
    bucket: record.bucket,
    objectKey: record.objectKey,
    originalFileName: record.originalFileName,
    mimeType: record.mimeType,
    size: record.size,
    etag: record.etag || null,
    status: record.status,
    customMetadata: record.customMetadata ? JSON.stringify(record.customMetadata) : null,
    createdAt: now,
    updatedAt: now,
  });

  return {
    ...record,
    createdAt: now,
    updatedAt: now,
  };
}

export function getFileRecordByKey(bucket: string, objectKey: string): FileRecord | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM file_records WHERE bucket = ? AND object_key = ? AND status != 'deleted'
  `);
  const row: any = stmt.get(bucket, objectKey);
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    bucket: row.bucket,
    objectKey: row.object_key,
    originalFileName: row.original_filename,
    mimeType: row.mime_type,
    size: row.size,
    etag: row.etag || undefined,
    status: row.status,
    customMetadata: row.custom_metadata ? JSON.parse(row.custom_metadata) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listFileRecords(filter: {
  bucket?: string;
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): FileRecord[] {
  const db = getDatabase();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter.bucket) {
    conditions.push("bucket = ?");
    params.push(filter.bucket);
  }
  if (filter.userId) {
    conditions.push("user_id = ?");
    params.push(filter.userId);
  }
  if (filter.status) {
    conditions.push("status = ?");
    params.push(filter.status);
  } else {
    conditions.push("status != 'deleted'");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filter.limit || 100;
  const offset = filter.offset || 0;

  const stmt = db.prepare(`
    SELECT * FROM file_records
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const rows: any[] = stmt.all(...params, limit, offset);

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    bucket: row.bucket,
    objectKey: row.object_key,
    originalFileName: row.original_filename,
    mimeType: row.mime_type,
    size: row.size,
    etag: row.etag || undefined,
    status: row.status,
    customMetadata: row.custom_metadata ? JSON.parse(row.custom_metadata) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function markFileDeleted(bucket: string, objectKey: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE file_records SET status = 'deleted', updated_at = ? WHERE bucket = ? AND object_key = ?
  `);
  stmt.run(new Date().toISOString(), bucket, objectKey);
}
