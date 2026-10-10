import React, { useState } from "react";
import { FolderPlus, X } from "lucide-react";

interface AwsCreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
}

export const AwsCreateFolderModal: React.FC<AwsCreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
}) => {
  const [folderName, setFolderName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg max-w-md w-full shadow-2xl p-5 space-y-4 font-sans text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
          <h3 className="font-bold text-sm text-gray-100 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-amber-500" />
            <span>Create Folder</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-1">Folder name</label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g. assets or logs"
            className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-gray-200 font-mono text-xs focus:outline-none focus:border-amber-500"
          />
          <p className="text-[11px] text-gray-400 mt-1 font-sans">
            Folder names cannot contain slashes. Amazon S3 uses the trailing slash '/' as virtual directory delimiter.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#334155]">
          <button onClick={onClose} className="btn-aws-secondary text-xs">Cancel</button>
          <button
            onClick={() => {
              if (folderName.trim()) {
                onCreateFolder(folderName.trim());
                onClose();
              }
            }}
            disabled={!folderName.trim()}
            className="btn-aws-primary text-xs"
          >
            Create folder
          </button>
        </div>
      </div>
    </div>
  );
};
