import React, { useState } from "react";
import { ArrowDown, ArrowRight, ShieldCheck, Zap, Database, Server, Laptop, Activity } from "lucide-react";

export const ArchitectureDiagram: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<string>("all");

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-start gap-3">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-zinc-200">Zero-RAM Direct Streaming Architecture</p>
          <p className="text-zinc-400 mt-0.5">
            File payloads never pass through the Next.js Node.js server RAM during file uploads or downloads.
            Clients obtain a signed SigV4 ticket from the API and stream binaries directly to/from MinIO S3 storage.
          </p>
        </div>
      </div>

      {/* Interactive System Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {/* Tier 1: Client Front-End */}
        <div
          onClick={() => setActiveLayer("client")}
          className={`p-3.5 rounded-lg border transition cursor-pointer ${
            activeLayer === "client" || activeLayer === "all"
              ? "bg-zinc-950 border-purple-500/50 shadow-lg shadow-purple-950/20"
              : "bg-zinc-950/40 border-zinc-900 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Tier 1</span>
            <Laptop className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 mb-1">Industrial Client UI</h4>
          <p className="text-[11px] text-zinc-400 mb-3 font-sans">
            Next.js 14 Client Components, React 18 Concurrent state, Lucide icons, and Tailwind styling.
          </p>
          <div className="space-y-1.5 text-[10px] text-zinc-400 border-t border-zinc-900 pt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>Multipart Chunk Slicer (5MB+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>Direct SigV4 HTTP PUT/GET Streamer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>Keyboard Command Palette (⌘K)</span>
            </div>
          </div>
        </div>

        {/* Tier 2: Next.js API Gateway */}
        <div
          onClick={() => setActiveLayer("gateway")}
          className={`p-3.5 rounded-lg border transition cursor-pointer ${
            activeLayer === "gateway" || activeLayer === "all"
              ? "bg-zinc-950 border-sky-500/50 shadow-lg shadow-sky-950/20"
              : "bg-zinc-950/40 border-zinc-900 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Tier 2</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 mb-1">Control Plane API</h4>
          <p className="text-[11px] text-zinc-400 mb-3 font-sans">
            Next.js Route Handlers, Zod schema validation, AWS SDK v3 Presigner engine.
          </p>
          <div className="space-y-1.5 text-[10px] text-zinc-400 border-t border-zinc-900 pt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>Zod Key & Bucket Sanitization</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>SigV4 Presigned Ticket Dispenser</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>Zero-RAM Route Handlers</span>
            </div>
          </div>
        </div>

        {/* Tier 3: Storage & Audit Layer */}
        <div
          onClick={() => setActiveLayer("storage")}
          className={`p-3.5 rounded-lg border transition cursor-pointer ${
            activeLayer === "storage" || activeLayer === "all"
              ? "bg-zinc-950 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
              : "bg-zinc-950/40 border-zinc-900 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Tier 3</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 mb-1">Data & Audit Plane</h4>
          <p className="text-[11px] text-zinc-400 mb-3 font-sans">
            MinIO distributed S3 cluster alongside better-sqlite3 WAL audit log ledger.
          </p>
          <div className="space-y-1.5 text-[10px] text-zinc-400 border-t border-zinc-900 pt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>MinIO S3 Object Storage Server</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>SQLite WAL Audit Ledger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Multi-part S3 Assembly Protocol</span>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Lifecyle Steps */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5">
        <h4 className="text-xs font-bold text-zinc-200 mb-2.5 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Upload Lifecycle Protocol Breakdown</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
          <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800">
            <div className="text-sky-400 font-bold text-[10px] uppercase mb-1">Step 1: Auth Handshake</div>
            <p className="text-zinc-300">
              Browser sends filename + size (~1KB) to <code className="text-sky-300">/api/storage/presign</code>. Next.js validates params and issues signed SigV4 URL.
            </p>
          </div>
          <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800">
            <div className="text-emerald-400 font-bold text-[10px] uppercase mb-1">Step 2: Direct Binary Stream</div>
            <p className="text-zinc-300">
              Browser streams binary payload directly to MinIO endpoint via HTTP PUT. Node.js server RAM remains completely untouched.
            </p>
          </div>
          <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800">
            <div className="text-purple-400 font-bold text-[10px] uppercase mb-1">Step 3: Audit Ledger Commit</div>
            <p className="text-zinc-300">
              Upon upload confirmation, audit event is written synchronously into <code className="text-purple-300">audit.db</code> with WAL durability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
