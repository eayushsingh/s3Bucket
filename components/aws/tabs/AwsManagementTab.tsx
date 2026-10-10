import React from "react";
import { Settings, Plus, Clock, Archive } from "lucide-react";

interface AwsManagementTabProps {
  bucket: string;
}

export const AwsManagementTab: React.FC<AwsManagementTabProps> = ({ bucket }) => {
  return (
    <div className="space-y-4 font-sans text-xs">
      <div className="p-4 bg-[#1e293b] border border-[#334155] rounded space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Lifecycle Configuration Rules</span>
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Manage your objects so that they are stored cost effectively throughout their lifecycle.
            </p>
          </div>
          <button className="btn-aws-primary text-[11px] flex items-center gap-1">
            <Plus className="w-3 h-3" />
            <span>Create lifecycle rule</span>
          </button>
        </div>

        {/* Lifecycle Rules Table */}
        <div className="border border-[#334155] rounded bg-[#0f172a] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-[#334155] text-gray-400 font-mono text-[11px]">
              <tr>
                <th className="py-2 px-3">Rule Name</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Scope</th>
                <th className="py-2 px-3">Transitions</th>
                <th className="py-2 px-3">Expiration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155] text-gray-300 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-amber-400">ArchiveOldLogs</td>
                <td className="py-2.5 px-3 text-emerald-400">Enabled</td>
                <td className="py-2.5 px-3">logs/*</td>
                <td className="py-2.5 px-3">Glacier after 90 days</td>
                <td className="py-2.5 px-3">Expire after 365 days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
