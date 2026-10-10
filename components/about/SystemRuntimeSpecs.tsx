import React, { useState, useEffect } from "react";
import { Server, Cpu, HardDrive, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface RuntimeData {
  nodeVersion: string;
  platform: string;
  architecture: string;
  uptimeSeconds: number;
  memory: {
    rssFormatted: string;
    heapUsedFormatted: string;
    heapTotalFormatted: string;
  };
  storageBackend: {
    provider: string;
    endpoint: string;
    region: string;
    forcePathStyle: boolean;
    presignedPutExpiry: string;
    presignedGetExpiry: string;
  };
  auditLedger: {
    engine: string;
    mode: string;
    dbPath: string;
  };
}

export const SystemRuntimeSpecs: React.FC = () => {
  const [data, setData] = useState<RuntimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/system/stack");
      const json = await res.json();
      if (json.success && json.data?.runtime) {
        setData(json.data.runtime);
      } else {
        setError("Unable to inspect system runtime specs.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to query system specs endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m ${seconds % 60}s`;
    if (mins > 0) return `${mins}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading && !data) {
    return (
      <div className="p-8 text-center font-mono text-xs text-zinc-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
        <span>Probing runtime environment & storage subsystems...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-950/40 border border-rose-900 rounded-lg text-rose-300 text-xs font-mono flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
          Host Environment & Storage Diagnostics
        </span>
        <button
          onClick={fetchSpecs}
          disabled={loading}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-sky-400 transition"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Node & OS */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase mb-1">
            <span>Node.js Engine</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-zinc-100">{data.nodeVersion}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {data.platform} ({data.architecture}) • Uptime: {formatUptime(data.uptimeSeconds)}
          </p>
        </div>

        {/* Process Memory */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase mb-1">
            <span>Process Heap (RAM)</span>
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <p className="text-sm font-bold text-zinc-100">{data.memory.heapUsedFormatted}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Total Allocated: {data.memory.heapTotalFormatted} (RSS: {data.memory.rssFormatted})
          </p>
        </div>

        {/* Storage Endpoint */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase mb-1">
            <span>Target S3 Server</span>
            <Server className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-sm font-bold text-zinc-100 truncate">{data.storageBackend.provider}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            {data.storageBackend.endpoint} ({data.storageBackend.region})
          </p>
        </div>
      </div>

      {/* Configuration Highlights */}
      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
        <div>
          <span className="text-zinc-500 block mb-1">Storage Protocol Configuration:</span>
          <div className="space-y-1 text-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Path Style Addressing:</span>
              <span className="text-emerald-400 font-semibold">{data.storageBackend.forcePathStyle ? "Enabled (S3/MinIO)" : "Virtual-Hosted"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Presigned PUT Expiry:</span>
              <span>{data.storageBackend.presignedPutExpiry}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Presigned GET Expiry:</span>
              <span>{data.storageBackend.presignedGetExpiry}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-zinc-500 block mb-1">Audit Ledger & Transactional Journal:</span>
          <div className="space-y-1 text-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Ledger Engine:</span>
              <span className="text-sky-400 font-semibold">{data.auditLedger.engine}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Journaling Mode:</span>
              <span className="text-purple-400">{data.auditLedger.mode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Database File:</span>
              <span className="truncate max-w-[150px]">{data.auditLedger.dbPath}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
