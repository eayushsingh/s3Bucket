"use client";

import React from "react";
import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "⌘ K / Ctrl+K", description: "Open Command Palette" },
    { key: "/", description: "Focus object search & filter" },
    { key: "r", description: "Refresh current bucket objects" },
    { key: "u", description: "Open Single File Uploader" },
    { key: "m", description: "Open Multipart Resilient Uploader" },
    { key: "l", description: "Open S3 Live Audit Trail" },
    { key: "d", description: "Open System Diagnostics Probe" },
    { key: "p", description: "Open Bucket Configuration & Policies" },
    { key: "a", description: "Open About System & Technology Stack" },
    { key: "?", description: "Toggle this Keyboard Shortcuts legend" },
    { key: "Esc", description: "Close any modal, drawer, or dialog" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-4 h-4 text-zinc-300" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Keyboard Shortcuts Reference
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 divide-y divide-zinc-900 max-h-[70vh] overflow-y-auto font-mono text-xs">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-zinc-400 font-sans text-xs">{s.description}</span>
              <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700/80 rounded text-[11px] text-zinc-200 shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
