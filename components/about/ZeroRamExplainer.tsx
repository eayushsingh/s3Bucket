import React from "react";
import { ShieldCheck, Flame, ArrowRight, CheckCircle2, AlertTriangle, Code } from "lucide-react";

export const ZeroRamExplainer: React.FC = () => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-RAM Streaming vs Server-Proxying Comparison</span>
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            How s3Bucket handles multi-gigabyte uploads without memory exhaustion on the web server.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Anti-pattern: Traditional Server Proxying */}
        <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/50 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Traditional Naive Proxy (Anti-pattern)</span>
          </div>
          <p className="text-zinc-300 font-sans text-xs">
            Browser sends 5 GB multipart body to Next.js API route. Next.js server allocates 5 GB in Node.js V8 Heap memory buffer before piping to S3.
          </p>
          <div className="p-2 rounded bg-zinc-950 border border-rose-900/40 text-[10px] text-rose-300 space-y-1">
            <div>❌ Memory Spike: 5+ GB RAM consumed per concurrent upload</div>
            <div>❌ Risk: Node.js process Out-Of-Memory (OOM) crash</div>
            <div>❌ Latency: Doubles upload transfer time (2x hops)</div>
          </div>
        </div>

        {/* The s3Bucket Pattern: Zero-RAM Direct Streaming */}
        <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/50 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Zero-RAM Direct Streaming (s3Bucket Architecture)</span>
          </div>
          <p className="text-zinc-300 font-sans text-xs">
            Browser requests a signed SigV4 ticket (~1KB payload). Server signs ticket in &lt;1ms. Browser then streams bytes directly to S3/MinIO.
          </p>
          <div className="p-2 rounded bg-zinc-950 border border-emerald-900/40 text-[10px] text-emerald-300 space-y-1">
            <div>✅ Server RAM Overhead: 0 MB (Zero proxy buffer)</div>
            <div>✅ Infinite Scalability: 10,000+ simultaneous uploads on 256MB VM</div>
            <div>✅ Direct Throughput: Line-rate S3 socket bandwidth</div>
          </div>
        </div>
      </div>

      {/* Code snippet comparison */}
      <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2 text-sky-400 text-[11px] font-bold mb-2">
          <Code className="w-3.5 h-3.5" />
          <span>Client Implementation with Standard Fetch:</span>
        </div>
        <pre className="p-2.5 rounded bg-zinc-950 text-zinc-300 overflow-x-auto text-[10px] leading-relaxed border border-zinc-800">
{`// 1. Obtain signed upload ticket (~1KB JSON)
const { data } = await fetch("/api/storage/presign", {
  method: "POST",
  body: JSON.stringify({ bucket: "backups", objectKey: "archive.tar.gz", operation: "PUT" })
}).then(r => r.json());

// 2. Stream binary directly to MinIO/S3 (Zero Server RAM!)
await fetch(data.presignedUrl, {
  method: "PUT",
  headers: { "Content-Type": "application/gzip" },
  body: fileBlob, // Direct stream
});`}
        </pre>
      </div>
    </div>
  );
};
