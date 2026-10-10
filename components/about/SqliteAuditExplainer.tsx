import React from "react";
import { Database, Shield, Lock, FileText, CheckCircle2 } from "lucide-react";

export const SqliteAuditExplainer: React.FC = () => {
  const schemaFields = [
    { name: "id", type: "TEXT PRIMARY KEY", desc: "UUIDv4 unique transaction identifier" },
    { name: "bucket", type: "TEXT NOT NULL", desc: "Target S3 bucket namespace" },
    { name: "objectKey", type: "TEXT", desc: "Target object key or null for bucket-level actions" },
    { name: "action", type: "TEXT NOT NULL", desc: "Operation verb (CREATE_BUCKET, UPLOAD, DELETE, PRESIGN, etc.)" },
    { name: "status", type: "TEXT NOT NULL", desc: "SUCCESS or FAILURE execution state" },
    { name: "actor", type: "TEXT NOT NULL", desc: "Authenticated identity or system worker" },
    { name: "ipAddress", type: "TEXT", desc: "Caller client IP address" },
    { name: "metadata", type: "TEXT", desc: "JSON encoded operational metadata & byte size" },
    { name: "createdAt", type: "INTEGER NOT NULL", desc: "Microsecond UNIX timestamp of execution" },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>SQLite WAL Audit Ledger Architecture</span>
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Synchronous, immutable audit trail engine powered by <code className="text-sky-300">better-sqlite3</code>.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950/60 text-sky-400 border border-sky-800 font-semibold uppercase">
          WAL Mode
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg">
          <div className="text-emerald-400 font-bold text-[11px] mb-1">Synchronous C-Bindings</div>
          <p className="text-zinc-400 text-[10px] font-sans">
            Executes SQLite operations synchronously without Node.js Promise overhead, ensuring immediate disk commit before responding to the client.
          </p>
        </div>
        <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg">
          <div className="text-sky-400 font-bold text-[11px] mb-1">Write-Ahead Logging (WAL)</div>
          <p className="text-zinc-400 text-[10px] font-sans">
            Separates write journals from main database file, allowing concurrent read queries without blocking incoming audit writes.
          </p>
        </div>
        <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg">
          <div className="text-purple-400 font-bold text-[11px] mb-1">Zero External Daemons</div>
          <p className="text-zinc-400 text-[10px] font-sans">
            Completely embedded database. No PostgreSQL, MySQL, or Redis containers required for operational audit logging.
          </p>
        </div>
      </div>

      {/* Audit Schema Table */}
      <div>
        <h5 className="text-[11px] font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span>Audit Log Table Schema (audit_logs)</span>
        </h5>
        <div className="overflow-x-auto border border-zinc-800 rounded-lg">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-3">Column</th>
                <th className="py-1.5 px-3">SQL Type</th>
                <th className="py-1.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {schemaFields.map((f) => (
                <tr key={f.name} className="hover:bg-zinc-900/30">
                  <td className="py-1.5 px-3 text-sky-300 font-bold">{f.name}</td>
                  <td className="py-1.5 px-3 text-emerald-400">{f.type}</td>
                  <td className="py-1.5 px-3 text-zinc-400 font-sans text-xs">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
