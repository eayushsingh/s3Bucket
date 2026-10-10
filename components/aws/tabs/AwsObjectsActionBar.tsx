import React from "react";
import { Upload, FolderPlus, Download, Trash2, ExternalLink, Copy } from "lucide-react";

interface AwsObjectsActionBarProps {
  selectedCount: number;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
  onDownloadSelected: () => void;
  onOpenDeleteModal: () => void;
  onCopyS3Uri: () => void;
  onOpenPresigned: () => void;
}

export const AwsObjectsActionBar: React.FC<AwsObjectsActionBarProps> = ({
  selectedCount,
  onOpenUpload,
  onOpenCreateFolder,
  onDownloadSelected,
  onOpenDeleteModal,
  onCopyS3Uri,
  onOpenPresigned,
}) => {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#1e293b] border border-[#334155] rounded text-xs font-sans">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onCopyS3Uri}
          disabled={!hasSelection}
          className="btn-aws-secondary text-[11px] disabled:opacity-40 flex items-center gap-1"
        >
          <Copy className="w-3 h-3" />
          <span>Copy S3 URI</span>
        </button>

        <button
          onClick={onOpenPresigned}
          disabled={selectedCount !== 1}
          className="btn-aws-secondary text-[11px] disabled:opacity-40 flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Open</span>
        </button>

        <button
          onClick={onDownloadSelected}
          disabled={!hasSelection}
          className="btn-aws-secondary text-[11px] disabled:opacity-40 flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </button>

        <button
          onClick={onOpenDeleteModal}
          disabled={!hasSelection}
          className="px-3 py-1.5 rounded text-[11px] bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 disabled:opacity-40 flex items-center gap-1 transition"
        >
          <Trash2 className="w-3 h-3" />
          <span>Delete</span>
        </button>

        <button
          onClick={onOpenCreateFolder}
          className="btn-aws-secondary text-[11px] flex items-center gap-1"
        >
          <FolderPlus className="w-3 h-3" />
          <span>Create folder</span>
        </button>
      </div>

      <button
        onClick={onOpenUpload}
        className="btn-aws-primary text-xs flex items-center gap-1.5 shadow"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Upload</span>
      </button>
    </div>
  );
};
