import React from "react";
import { BarChart3, Activity, HardDrive, ArrowUpRight } from "lucide-react";

interface AwsMetricsTabProps {
  bucket: string;
}

export const AwsMetricsTab: React.FC<AwsMetricsTabProps> = ({ bucket }) => {
  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Metrics Summary Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-[#1e293b] border border-[#334155] rounded">
          <div className="text-[10px] text-gray-400 uppercase">Total Bucket Storage</div>
          <p className="text-lg font-bold text-gray-100 mt-1">42.8 MB</p>
          <span className="text-[10px] text-emerald-400">Standard Tier</span>
        </div>
        <div className="p-3 bg-[#1e293b] border border-[#334155] rounded">
          <div className="text-[10px] text-gray-400 uppercase">Total Object Count</div>
          <p className="text-lg font-bold text-gray-100 mt-1">128</p>
          <span className="text-[10px] text-sky-400">Indexed Keys</span>
        </div>
        <div className="p-3 bg-[#1e293b] border border-[#334155] rounded">
          <div className="text-[10px] text-gray-400 uppercase">24h GET Requests</div>
          <p className="text-lg font-bold text-gray-100 mt-1">1,492</p>
          <span className="text-[10px] text-gray-400">All clients</span>
        </div>
        <div className="p-3 bg-[#1e293b] border border-[#334155] rounded">
          <div className="text-[10px] text-gray-400 uppercase">MinIO Socket Latency</div>
          <p className="text-lg font-bold text-gray-100 mt-1">3.2 ms</p>
          <span className="text-[10px] text-emerald-400">Healthy</span>
        </div>
      </div>

      {/* CloudWatch Telemetry Panel */}
      <div className="p-4 bg-[#1e293b] border border-[#334155] rounded space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>CloudWatch Storage Metrics Monitor</span>
          </h3>
          <span className="text-[11px] text-gray-400 font-mono">Aggregation Period: 1 Day</span>
        </div>
        <div className="h-44 bg-[#0f172a] rounded border border-[#334155] p-4 flex items-center justify-center font-mono text-gray-400 text-xs">
          [CloudWatch Metric Stream: StorageSizeBytes & NumberOfObjects Active]
        </div>
      </div>
    </div>
  );
};
