import React from "react";

export const AwsLogo: React.FC<{ className?: string }> = ({ className = "h-5 w-auto" }) => (
  <div className={`flex items-center gap-1.5 font-bold tracking-tight text-white select-none ${className}`}>
    <span className="text-sm font-extrabold text-amber-500 font-mono">aws</span>
    <span className="text-xs font-semibold px-1 py-0.2 bg-amber-500/20 text-amber-400 rounded border border-amber-500/40">
      S3
    </span>
  </div>
);
