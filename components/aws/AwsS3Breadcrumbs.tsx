import React, { useState } from "react";
import { ChevronRight, Copy, Check, Database, Folder } from "lucide-react";

interface AwsS3BreadcrumbsProps {
  bucket: string | null;
  currentPrefix: string;
  onNavigatePrefix: (prefix: string) => void;
  onSelectBucketRoot: () => void;
}

export const AwsS3Breadcrumbs: React.FC<AwsS3BreadcrumbsProps> = ({
  bucket,
  currentPrefix,
  onNavigatePrefix,
  onSelectBucketRoot,
}) => {
  const [copiedArn, setCopiedArn] = useState(false);

  const arn = bucket ? `arn:aws:s3:::${bucket}` : "";

  const handleCopyArn = () => {
    if (!arn) return;
    navigator.clipboard.writeText(arn);
    setCopiedArn(true);
    setTimeout(() => setCopiedArn(false), 2000);
  };

  const prefixParts = currentPrefix.split("/").filter(Boolean);

  return (
    <div className="bg-[#1e293b]/70 border border-[#334155] rounded px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono shadow-sm">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-gray-400 hover:text-white transition cursor-pointer">Amazon S3</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-gray-400 hover:text-white transition cursor-pointer">Buckets</span>

        {bucket && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            <button
              onClick={onSelectBucketRoot}
              className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{bucket}</span>
            </button>
          </>
        )}

        {prefixParts.map((part, idx) => {
          const subPrefix = prefixParts.slice(0, idx + 1).join("/") + "/";
          return (
            <React.Fragment key={subPrefix}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              <button
                onClick={() => onNavigatePrefix(subPrefix)}
                className="text-gray-300 hover:text-white flex items-center gap-1"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400/80" />
                <span>{part}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {bucket && (
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="truncate max-w-[220px]">{arn}</span>
          <button
            onClick={handleCopyArn}
            className="p-1 hover:text-white bg-[#0f172a] border border-[#334155] rounded transition"
            title="Copy S3 Bucket ARN"
          >
            {copiedArn ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  );
};
