import React, { useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface AwsSearchBarProps {
  onSearch?: (q: string) => void;
  onOpenCommandPalette?: () => void;
}

export const AwsSearchBar: React.FC<AwsSearchBarProps> = ({ onOpenCommandPalette }) => {
  return (
    <div
      onClick={onOpenCommandPalette}
      className="flex items-center gap-2 bg-[#161e2e] hover:bg-[#1f2937] border border-[#374151] rounded px-3 py-1 text-xs text-gray-300 cursor-pointer transition w-64 md:w-80 group"
      title="Search services, features, and documentation (Alt+S or Cmd+K)"
    >
      <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition" />
      <span className="flex-1 text-gray-400 text-[11px] truncate">
        Search for services, features, docs...
      </span>
      <kbd className="text-[10px] bg-[#111827] text-gray-400 px-1.5 py-0.5 rounded border border-gray-700 font-mono">
        Alt+S
      </kbd>
    </div>
  );
};
