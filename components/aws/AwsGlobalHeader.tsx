import React from "react";
import { Terminal, Bell, HelpCircle, User, Activity } from "lucide-react";
import { AwsLogo } from "./AwsLogo";
import { AwsSearchBar } from "./AwsSearchBar";
import { AwsRegionSelector } from "./AwsRegionSelector";

interface AwsGlobalHeaderProps {
  onOpenCommandPalette: () => void;
  onOpenAuditLog: () => void;
  onOpenShortcuts: () => void;
  onOpenAbout: () => void;
}

export const AwsGlobalHeader: React.FC<AwsGlobalHeaderProps> = ({
  onOpenCommandPalette,
  onOpenAuditLog,
  onOpenShortcuts,
  onOpenAbout,
}) => {
  return (
    <header className="bg-[#232f3e] border-b border-[#161e2e] text-white px-4 py-2 flex items-center justify-between gap-4 select-none shadow-md">
      {/* Left branding & search */}
      <div className="flex items-center gap-4">
        <AwsLogo />
        <AwsSearchBar onOpenCommandPalette={onOpenCommandPalette} />
      </div>

      {/* Right controls & account */}
      <div className="flex items-center gap-2">
        {/* CloudShell */}
        <button
          onClick={onOpenAuditLog}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[#161e2e] rounded border border-transparent hover:border-gray-700 transition"
          title="AWS CloudShell & Live Audit Stream (L)"
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Region selector */}
        <AwsRegionSelector />

        {/* About System & Docs */}
        <button
          onClick={onOpenAbout}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[#161e2e] rounded border border-transparent hover:border-gray-700 transition"
          title="About AWS S3 Console & Tech Stack (A)"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
        </button>

        {/* Account Identity */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-700 text-xs">
          <div className="hidden lg:block text-right">
            <div className="text-gray-200 font-medium">Administrator</div>
            <div className="text-[10px] text-gray-400 font-mono">4920-1928-3012</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-xs">
            A
          </div>
        </div>
      </div>
    </header>
  );
};
