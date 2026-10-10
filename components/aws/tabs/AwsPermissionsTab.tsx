import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, FileText, CheckCircle2, Lock } from "lucide-react";
import { getDefaultBucketPolicy, DEFAULT_CORS_CONFIG } from "../aws.constants";

interface AwsPermissionsTabProps {
  bucket: string;
}

export const AwsPermissionsTab: React.FC<AwsPermissionsTabProps> = ({ bucket }) => {
  const [policyText, setPolicyText] = useState(getDefaultBucketPolicy(bucket));
  const [corsText, setCorsText] = useState(DEFAULT_CORS_CONFIG);
  const [blockPublic, setBlockPublic] = useState(true);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Block Public Access Banner */}
      <div className={`p-4 rounded border ${blockPublic ? "aws-callout-info" : "aws-callout-warning"}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {blockPublic ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            )}
            <h3 className="text-sm font-bold text-gray-100">
              Block Public Access (Bucket Settings)
            </h3>
          </div>
          <button
            onClick={() => setBlockPublic(!blockPublic)}
            className="btn-aws-secondary text-[11px]"
          >
            Edit Settings
          </button>
        </div>
        <p className="text-gray-300 text-xs mb-3">
          Block public access settings are applied to this bucket, access points, and all contained objects.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-gray-300">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Block public access to buckets and objects granted through new ACLs</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Block public and cross-account access granted through any public bucket policies</span>
          </div>
        </div>
      </div>

      {/* Bucket Policy JSON Editor */}
      <div className="p-4 bg-[#1e293b] border border-[#334155] rounded space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Bucket Policy (JSON)</span>
          </h3>
          <button
            onClick={() => alert("Bucket policy updated successfully.")}
            className="btn-aws-primary text-[11px]"
          >
            Save Changes
          </button>
        </div>
        <textarea
          value={policyText}
          onChange={(e) => setPolicyText(e.target.value)}
          rows={10}
          className="w-full bg-[#0f172a] border border-[#334155] rounded p-3 font-mono text-[11px] text-gray-200 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Cross-Origin Resource Sharing (CORS) */}
      <div className="p-4 bg-[#1e293b] border border-[#334155] rounded space-y-2">
        <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Cross-Origin Resource Sharing (CORS)</span>
        </h3>
        <textarea
          value={corsText}
          onChange={(e) => setCorsText(e.target.value)}
          rows={7}
          className="w-full bg-[#0f172a] border border-[#334155] rounded p-3 font-mono text-[11px] text-gray-200 focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );
};
