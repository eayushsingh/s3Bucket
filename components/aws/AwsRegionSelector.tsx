import React, { useState } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { AWS_REGIONS } from "./aws.constants";
import { AwsRegionInfo } from "./aws.types";

export const AwsRegionSelector: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<AwsRegionInfo>(AWS_REGIONS[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-200 hover:text-white hover:bg-[#1f2937] rounded border border-transparent hover:border-gray-700 transition"
      >
        <Globe className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-medium truncate max-w-[120px] hidden sm:inline">{selectedRegion.name}</span>
        <span className="text-gray-400 font-mono text-[11px]">({selectedRegion.id})</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-[#1f2937] border border-gray-700 rounded shadow-2xl py-1 z-50 text-xs font-mono">
          <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-700">
            Select AWS Region
          </div>
          {AWS_REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRegion(r);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#374151] transition"
            >
              <div>
                <div className="text-gray-200 font-sans text-xs">{r.name}</div>
                <div className="text-gray-400 text-[10px]">{r.id} • {r.location}</div>
              </div>
              {selectedRegion.id === r.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
