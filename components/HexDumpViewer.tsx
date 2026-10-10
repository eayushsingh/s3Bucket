"use client";

import React, { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

interface HexDumpViewerProps {
  base64Data: string;
  maxBytesDisplay?: number;
}

export function HexDumpViewer({ base64Data, maxBytesDisplay = 4096 }: HexDumpViewerProps) {
  const [copied, setCopied] = useState(false);

  const { rows, totalBytes, isTruncated } = useMemo(() => {
    try {
      const binaryStr = atob(base64Data);
      const total = binaryStr.length;
      const limit = Math.min(total, maxBytesDisplay);
      const rowsArr: Array<{ offset: string; hex: string[]; ascii: string }> = [];

      for (let i = 0; i < limit; i += 16) {
        const offset = i.toString(16).padStart(8, "0");
        const hexGroup: string[] = [];
        let asciiGroup = "";

        for (let j = 0; j < 16; j++) {
          const byteIndex = i + j;
          if (byteIndex < limit) {
            const code = binaryStr.charCodeAt(byteIndex);
            hexGroup.push(code.toString(16).padStart(2, "0"));
            asciiGroup += code >= 32 && code <= 126 ? String.fromCharCode(code) : ".";
          } else {
            hexGroup.push("  ");
          }
        }

        rowsArr.push({
          offset,
          hex: hexGroup,
          ascii: asciiGroup,
        });
      }

      return { rows: rowsArr, totalBytes: total, isTruncated: total > maxBytesDisplay };
    } catch (e) {
      return { rows: [], totalBytes: 0, isTruncated: false };
    }
  }, [base64Data, maxBytesDisplay]);

  const copyDump = () => {
    const text = rows
      .map(
        (r) =>
          `${r.offset}  ${r.hex.slice(0, 8).join(" ")}  ${r.hex.slice(8).join(" ")}  |${r.ascii}|`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded font-mono text-[11px] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-300">HEX DUMP</span>
          <span className="text-[10px] text-zinc-500">
            {totalBytes} bytes {isTruncated ? `(showing first ${maxBytesDisplay})` : ""}
          </span>
        </div>
        <button
          onClick={copyDump}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy Hex"}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto p-2.5 space-y-0.5 select-text">
        {rows.map((row) => (
          <div key={row.offset} className="flex gap-4 hover:bg-zinc-900/60 px-1 rounded">
            <span className="text-zinc-500 select-none">{row.offset}</span>
            <div className="flex gap-2 text-zinc-300">
              <span className="text-sky-300">{row.hex.slice(0, 8).join(" ")}</span>
              <span className="text-zinc-600 select-none">|</span>
              <span className="text-indigo-300">{row.hex.slice(8).join(" ")}</span>
            </div>
            <span className="text-emerald-400 border-l border-zinc-800 pl-3 select-none">
              {row.ascii}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
