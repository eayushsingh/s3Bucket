import React from "react";
import { AwsS3TabId } from "./aws.types";
import { Folder, Sliders, Shield, BarChart3, Settings, Network } from "lucide-react";

interface AwsS3TabBarProps {
  activeTab: AwsS3TabId;
  onTabChange: (tab: AwsS3TabId) => void;
  objectCount?: number;
}

export const AwsS3TabBar: React.FC<AwsS3TabBarProps> = ({
  activeTab,
  onTabChange,
  objectCount = 0,
}) => {
  const tabs: { id: AwsS3TabId; label: string; icon: any; count?: number }[] = [
    { id: "objects", label: "Objects", icon: Folder, count: objectCount },
    { id: "properties", label: "Properties", icon: Sliders },
    { id: "permissions", label: "Permissions", icon: Shield },
    { id: "metrics", label: "Metrics", icon: BarChart3 },
    { id: "management", label: "Management", icon: Settings },
    { id: "access-points", label: "Access points", icon: Network },
  ];

  return (
    <div className="border-b border-[#334155] bg-[#0f172a] px-2 flex items-center gap-1 overflow-x-auto scrollbar-none font-sans text-xs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 flex items-center gap-2 font-medium transition whitespace-nowrap border-b-2 ${
              isActive
                ? "border-[#ec7211] text-[#ec7211] font-semibold bg-[#1e293b]/40"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1e293b]/20"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#334155] text-gray-300 font-mono">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
