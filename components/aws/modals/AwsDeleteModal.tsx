import React, { useState } from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

interface AwsDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetKeys: string[];
  onConfirmDelete: () => void;
}

export const AwsDeleteModal: React.FC<AwsDeleteModalProps> = ({
  isOpen,
  onClose,
  targetKeys,
  onConfirmDelete,
}) => {
  const [confirmInput, setConfirmInput] = useState("");

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim() === "permanently delete";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg max-w-lg w-full shadow-2xl p-5 space-y-4 font-sans text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Delete Objects</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="aws-callout-danger text-rose-200 text-xs">
          Permanently delete {targetKeys.length} object(s)? This action cannot be reversed.
        </div>

        <div className="max-h-36 overflow-y-auto bg-[#0f172a] p-2.5 rounded border border-[#334155] font-mono text-[11px] text-gray-300 divide-y divide-gray-800">
          {targetKeys.map((k) => (
            <div key={k} className="py-1 truncate">{k}</div>
          ))}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-1">
            To confirm deletion, type <strong className="text-rose-400">permanently delete</strong> in the field below:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="permanently delete"
            className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-gray-200 font-mono text-xs focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#334155]">
          <button onClick={onClose} className="btn-aws-secondary text-xs">Cancel</button>
          <button
            onClick={() => {
              if (isConfirmed) {
                onConfirmDelete();
                onClose();
              }
            }}
            disabled={!isConfirmed}
            className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete objects</span>
          </button>
        </div>
      </div>
    </div>
  );
};
