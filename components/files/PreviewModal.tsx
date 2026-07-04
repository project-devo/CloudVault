"use client";

import { useEffect } from "react";
import { Download, X } from "lucide-react";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { getPreviewKind } from "@/lib/preview";
import type { FileItem } from "@/types";
import MarkdownPreview from "./preview/MarkdownPreview";
import PdfPreview from "./preview/PdfPreview";
import UnsupportedPreview from "./preview/UnsupportedPreview";

interface Props {
  file: FileItem | null;
  onClose: () => void;
}

export default function PreviewModal({ file, onClose }: Props) {
  useEffect(() => {
    if (!file) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [file, onClose]);

  if (!file) return null;

  const kind = getPreviewKind(file);
  const isOpen = true;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${file.name}`}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8",
        "bg-ink-950/80 backdrop-blur-md animate-fade-in"
      )}
      onClick={onClose}
    >
      <div
        className="card relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden shadow-soft-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {file.name}
            </p>
            <p className="text-xs text-ink-400">
              {formatBytes(file.size)} &middot;{" "}
              {formatDate(file.updated_at)} &middot; {kind.toUpperCase()} preview
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={`/api/files/${file.id}`}
              className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label={`Download ${file.name}`}
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-ink-900/40">
          {kind === "markdown" && <MarkdownPreview fileId={file.id} />}
          {kind === "pdf" && <PdfPreview fileId={file.id} />}
          {kind === "none" && <UnsupportedPreview file={file} />}
        </div>
      </div>
      <span className="sr-only">{isOpen ? "open" : "closed"}</span>
    </div>
  );
}
