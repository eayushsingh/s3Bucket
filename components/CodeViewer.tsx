"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, WrapText, AlignLeft, Search } from "lucide-react";

interface CodeViewerProps {
  content: string;
  language?: string;
  maxLinesDisplay?: number;
}

export function CodeViewer({ content, language = "text", maxLinesDisplay = 2000 }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [isFormatted, setIsFormatted] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const formattedContent = useMemo(() => {
    if (!isFormatted) return content;
    try {
      if (language === "json" || content.trim().startsWith("{") || content.trim().startsWith("[")) {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      }
    } catch {
      // not JSON
    }
    return content;
  }, [content, isFormatted, language]);

  const lines = useMemo(() => {
    return formattedContent.split("\n");
  }, [formattedContent]);

  const copyContent = () => {
    navigator.clipboard.writeText(formattedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded font-mono text-xs overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-300 uppercase">
            {language.toUpperCase()} PREVIEW
          </span>
          <span className="text-[10px] text-zinc-500">({lines.length} lines)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`p-1 rounded text-[11px] flex items-center gap-1 transition ${
              wordWrap ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Toggle word wrap"
          >
            <WrapText className="w-3 h-3" />
            <span className="hidden sm:inline text-[10px]">Wrap</span>
          </button>

          <button
            onClick={copyContent}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="max-h-96 overflow-y-auto overflow-x-auto p-3">
        <table className="w-full border-collapse">
          <tbody>
            {lines.slice(0, maxLinesDisplay).map((line, idx) => {
              const lineNum = idx + 1;
              const matchesSearch =
                searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <tr
                  key={lineNum}
                  className={`hover:bg-zinc-900/50 ${
                    matchesSearch ? "bg-amber-500/20" : ""
                  }`}
                >
                  <td className="w-10 pr-3 text-right text-[11px] text-zinc-600 select-none align-top border-r border-zinc-900">
                    {lineNum}
                  </td>
                  <td
                    className={`pl-3 text-[11px] text-zinc-300 ${
                      wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                    }`}
                  >
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
