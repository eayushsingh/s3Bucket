import React from "react";
import { ShieldCheck, Check, AlertCircle, FileCode2 } from "lucide-react";

export const ZodValidationExplainer: React.FC = () => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Zod Input Validation & Sanitization Engine</span>
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Strict compile-time & runtime defensive guards powered by <code className="text-sky-300">zod</code>.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-400 border border-rose-800 font-semibold uppercase">
          Zero-Trust Boundary
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg space-y-2">
          <h5 className="font-bold text-zinc-200 text-[11px] flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>S3 Bucket DNS RFC-1123 Rules</span>
          </h5>
          <ul className="text-zinc-400 text-[10px] space-y-1 font-sans">
            <li>• Length bounded between 3 and 63 characters</li>
            <li>• Strict lowercase alphanumeric characters & hyphens</li>
            <li>• Cannot start or end with a hyphen or dot</li>
            <li>• Must not be formatted as an IP address (e.g. 192.168.5.4)</li>
          </ul>
        </div>

        <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg space-y-2">
          <h5 className="font-bold text-zinc-200 text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Object Key Path Traversal Defense</span>
          </h5>
          <ul className="text-zinc-400 text-[10px] space-y-1 font-sans">
            <li>• Automatic stripping of dangerous <code className="text-rose-300">../</code> relative sequences</li>
            <li>• Null-byte injection (<code className="text-rose-300">\0</code>) neutralization</li>
            <li>• Leading slash normalization (<code className="text-sky-300">/dir/file</code> → <code className="text-sky-300">dir/file</code>)</li>
            <li>• Maximum UTF-8 key length enforcement (1024 bytes)</li>
          </ul>
        </div>
      </div>

      <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2 text-rose-400 text-[11px] font-bold mb-2">
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Zod Schema Declaration Example:</span>
        </div>
        <pre className="p-2.5 rounded bg-zinc-950 text-zinc-300 overflow-x-auto text-[10px] leading-relaxed border border-zinc-800">
{`export const BucketNameSchema = z
  .string()
  .min(3, "Bucket name must be at least 3 characters")
  .max(63, "Bucket name must not exceed 63 characters")
  .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, "Must conform to DNS RFC-1123 naming rules")
  .refine((val) => !/^(\\d+\\.){3}\\d+$/.test(val), "Must not resemble an IPv4 address");`}
        </pre>
      </div>
    </div>
  );
};
