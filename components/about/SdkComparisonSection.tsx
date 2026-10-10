import React from "react";
import { Check, X, Shield, Cpu, Package, Zap } from "lucide-react";

export const SdkComparisonSection: React.FC = () => {
  const comparisonItems = [
    {
      metric: "Package Bundle Footprint",
      sdkV2: "~70 MB monolithic bundle (all 300+ AWS services included)",
      sdkV3: "~2.1 MB modular client (`@aws-sdk/client-s3` only)",
      winner: "v3",
    },
    {
      metric: "Tree-Shaking Support",
      sdkV2: "No tree-shaking; entire AWS namespace imported into memory",
      sdkV3: "Complete tree-shaking per command (PutObject, GetObject)",
      winner: "v3",
    },
    {
      metric: "TypeScript Typing Engine",
      sdkV2: "Retro-fitted namespace typings; frequent type mismatches",
      sdkV3: "Native TypeScript 1st-class types with strict discriminated unions",
      winner: "v3",
    },
    {
      metric: "Presigned URL Generation",
      sdkV2: "`s3.getSignedUrl(operation, params)` (tightly coupled)",
      sdkV3: "Dedicated `@aws-sdk/s3-request-presigner` with HMAC-SHA256 SigV4",
      winner: "v3",
    },
    {
      metric: "Node.js Stream Integration",
      sdkV2: "Custom event emitters (`createReadStream`)",
      sdkV3: "Standard WHATWG / Web ReadableStream & async iterables",
      winner: "v3",
    },
    {
      metric: "Active AWS Support Lifecycle",
      sdkV2: "Maintenance mode / End of Life announced by AWS",
      sdkV3: "Active development, LTS, security and performance patches",
      winner: "v3",
    },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>AWS SDK v3 vs Legacy SDK v2 Architectural Selection</span>
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Why s3Bucket is engineered exclusively on modular <code className="text-sky-300">@aws-sdk/client-s3</code>.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-semibold uppercase">
          Production Standard
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
              <th className="py-2 pr-3">Evaluation Metric</th>
              <th className="py-2 px-3 text-rose-400/90">Monolithic AWS SDK v2 (Legacy)</th>
              <th className="py-2 pl-3 text-emerald-400 font-bold">AWS SDK v3 (Current in s3Bucket)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-[11px]">
            {comparisonItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-zinc-900/40 transition">
                <td className="py-2.5 pr-3 text-zinc-300 font-semibold">{item.metric}</td>
                <td className="py-2.5 px-3 text-zinc-400 flex items-start gap-1.5">
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{item.sdkV2}</span>
                </td>
                <td className="py-2.5 pl-3 text-zinc-200 font-medium">
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item.sdkV3}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
