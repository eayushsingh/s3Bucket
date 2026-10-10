import React from "react";
import { ExternalLink, Github, CheckCircle2, Info, Layers } from "lucide-react";
import { LibraryInfo } from "@/lib/technology-stack";
import { TechBadge } from "./TechBadge";

interface LibraryCardProps {
  library: LibraryInfo;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({ library }) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4 flex flex-col justify-between hover:border-zinc-700 transition duration-200 shadow-md group">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-100 font-mono tracking-tight group-hover:text-sky-400 transition-colors">
                {library.name}
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
                {library.version}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-zinc-500 border border-zinc-800/60 uppercase">
                {library.license}
              </span>
            </div>
          </div>
          <TechBadge category={library.category} size="sm" />
        </div>

        {/* Short description */}
        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
          {library.description}
        </p>

        {/* Deep-dive: Why Chosen */}
        <div className="mb-3 p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Why Chosen for S3 Engine:</span>
          </div>
          <p className="text-zinc-300 leading-normal">
            {library.whyChosen}
          </p>
        </div>

        {/* Architectural Role */}
        <div className="mb-3 p-2.5 rounded bg-zinc-900/40 border border-zinc-800/60 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Subsystem Role:</span>
          </div>
          <p className="text-zinc-400 leading-normal">
            {library.architecturalRole}
          </p>
        </div>

        {/* Highlights Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {library.highlights.map((h, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* External Links Footer */}
      <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
        <a
          href={library.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-sky-400 transition"
        >
          <span>Documentation</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {library.repository && (
          <a
            href={library.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition"
          >
            <Github className="w-3 h-3" />
            <span>Source</span>
          </a>
        )}
      </div>
    </div>
  );
};
