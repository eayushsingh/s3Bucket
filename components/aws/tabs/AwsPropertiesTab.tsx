import React, { useState } from "react";
import { Sliders, ShieldCheck, Globe, Database, Key, Radio, Tag, CheckCircle2 } from "lucide-react";

interface AwsPropertiesTabProps {
  bucket: string;
}

export const AwsPropertiesTab: React.FC<AwsPropertiesTabProps> = ({ bucket }) => {
  const [versioningEnabled, setVersioningEnabled] = useState(false);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Overview Card */}
      <div className="p-4 bg-[#1e293b] border border-[#334155] rounded space-y-2">
        <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" />
          <span>Bucket Overview</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-gray-300 font-mono text-[11px]">
          <div>
            <span className="text-gray-400 block text-[10px]">AWS Region:</span>
            <span>us-east-1 (N. Virginia)</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Amazon Resource Name (ARN):</span>
            <span className="truncate text-amber-400">arn:aws:s3:::{bucket}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Creation Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Bucket Versioning Card */}
      <div className="p-4 bg-[#1e293b] border border-[#334155] rounded space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Bucket Versioning</span>
          </h3>
          <button
            onClick={() => setVersioningEnabled(!versioningEnabled)}
            className="btn-aws-secondary text-[11px]"
          >
            Edit
          </button>
        </div>
        <p className="text-gray-400 text-xs">
          Bucket versioning preserves multiple variants of an object in the same bucket to recover from unintended user actions.
        </p>
        <div className="pt-2">
          <span className="text-gray-400 text-[11px] block">Status:</span>
          <span className={`font-mono font-bold text-[11px] ${versioningEnabled ? "text-emerald-400" : "text-amber-400"}`}>
            {versioningEnabled ? "Enabled" : "Suspended"}
          </span>
        </div>
      </div>

      {/* Default Encryption Card */}
      <div className="p-4 bg-[#1e293b] border border-[#334155] rounded space-y-2">
        <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Default Encryption</span>
        </h3>
        <p className="text-gray-400 text-xs">
          Server-side encryption is automatically applied to new objects stored in this bucket.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-gray-300 font-mono text-[11px]">
          <div>
            <span className="text-gray-400 block text-[10px]">Encryption Type:</span>
            <span>Server-side encryption with Amazon S3 managed keys (SSE-S3)</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Bucket Key:</span>
            <span className="text-emerald-400">Enabled</span>
          </div>
        </div>
      </div>

      {/* Static Website Hosting Card */}
      <div className="p-4 bg-[#1e293b] border border-[#334155] rounded space-y-2">
        <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Static Website Hosting</span>
        </h3>
        <p className="text-gray-400 text-xs">
          Host a static website and configure custom error documents.
        </p>
        <div className="pt-2 font-mono text-[11px] text-gray-400">
          <span>Status: </span>
          <span className="text-gray-300 font-bold">Disabled</span>
        </div>
      </div>
    </div>
  );
};
