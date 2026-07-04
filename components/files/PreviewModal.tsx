"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Download,
  X,
  Maximize2,
  Minimize2,
  Info,
  Star,
  Trash2,
  Undo,
  Calendar,
  Database,
  FileCheck,
  FolderOpen
} from "lucide-react";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { getPreviewKind } from "@/lib/preview";
import type { FileItem } from "@/types";
import MarkdownPreview from "./preview/MarkdownPreview";
import PdfPreview from "./preview/PdfPreview";
import ImagePreview from "./preview/ImagePreview";
import AudioPreview from "./preview/AudioPreview";
import VideoPreview from "./preview/VideoPreview";
import CodePreview from "./preview/CodePreview";
import UnsupportedPreview from "./preview/UnsupportedPreview";

interface Props {
  file: FileItem | null;
  onClose: () => void;
}

export default function PreviewModal({ file, onClose }: Props) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [localFile, setLocalFile] = useState<FileItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setLocalFile(file);
    setIsFullscreen(false); // Reset on file change
  }, [file]);

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

  if (!mounted || !file || !localFile) return null;

  const kind = getPreviewKind(localFile);

  async function toggleStar() {
    if (!localFile) return;
    const nextStarred = !localFile.is_starred;
    setLocalFile({ ...localFile, is_starred: nextStarred });

    try {
      const res = await fetch(`/api/files/${localFile.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_starred: nextStarred }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error();
      }
      router.refresh();
    } catch {
      setLocalFile(localFile); // Rollback
      alert("Failed to update star status");
    }
  }

  async function toggleTrash() {
    if (!localFile) return;
    const nextTrashed = !localFile.is_trashed;
    setLocalFile({ ...localFile, is_trashed: nextTrashed });

    try {
      const res = await fetch(`/api/files/${localFile.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_trashed: nextTrashed }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error();
      }
      router.refresh();
      if (nextTrashed) {
        onClose();
      }
    } catch {
      setLocalFile(localFile); // Rollback
      alert("Failed to update trash status");
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${localFile.name}`}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-8",
        "bg-ink-950/80 backdrop-blur-md animate-fade-in"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "card relative flex w-full flex-col overflow-hidden shadow-soft-lg transition-all duration-300 ease-apple",
          isFullscreen 
            ? "h-screen w-screen max-h-screen max-w-none rounded-none border-0" 
            : "h-full max-h-[90vh] max-w-5xl rounded-2xl"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header Bar */}
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-ink-900/60 px-4 py-3 shrink-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {localFile.name}
            </p>
            <p className="text-xs text-ink-400">
              {formatBytes(localFile.size)} &middot;{" "}
              {formatDate(localFile.updated_at)} &middot; {kind.toUpperCase()} preview
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Info toggle (disabled in fullscreen) */}
            {!isFullscreen && (
              <button
                type="button"
                onClick={() => setShowSidebar(!showSidebar)}
                className={cn(
                  "rounded-lg p-2 transition-colors hover:bg-white/[0.06] hover:text-white hidden md:block",
                  showSidebar ? "text-accent-400 bg-white/[0.04]" : "text-ink-300"
                )}
                aria-label="Toggle file info sidebar"
              >
                <Info className="h-4 w-4" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Force Download (with download=true parameter) */}
            <a
              href={`/api/files/${localFile.id}?download=true`}
              className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label={`Download ${localFile.name}`}
            >
              <Download className="h-4 w-4" />
            </a>

            <div className="h-4 w-px bg-white/10 mx-0.5" />

            {/* Close Modal */}
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

        {/* Modal Inner Workspace */}
        <div className="flex min-h-0 flex-1">
          {/* Main preview stage */}
          <div className="min-h-0 flex-1 bg-ink-900/40 relative">
            {kind === "markdown" && <MarkdownPreview fileId={localFile.id} />}
            {kind === "pdf" && <PdfPreview fileId={localFile.id} />}
            {kind === "image" && <ImagePreview fileId={localFile.id} />}
            {kind === "audio" && <AudioPreview fileId={localFile.id} />}
            {kind === "video" && <VideoPreview fileId={localFile.id} />}
            {kind === "code" && <CodePreview fileId={localFile.id} />}
            {kind === "none" && <UnsupportedPreview file={localFile} />}
          </div>

          {/* Collapsible Info Sidebar */}
          {showSidebar && !isFullscreen && (
            <aside className="w-72 shrink-0 flex-col border-l border-white/[0.06] bg-ink-900/80 p-5 overflow-y-auto hidden md:flex animate-scale-in">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-4">
                File Details
              </h3>
              
              <div className="space-y-4 text-xs">
                {/* File size */}
                <div className="flex items-start gap-2.5">
                  <Database className="h-4 w-4 text-ink-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-medium text-white">Size</span>
                    <span className="text-ink-300">{formatBytes(localFile.size)} ({localFile.size.toLocaleString()} bytes)</span>
                  </div>
                </div>

                {/* File Type */}
                <div className="flex items-start gap-2.5">
                  <FileCheck className="h-4 w-4 text-ink-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-medium text-white">Type</span>
                    <span className="text-ink-300 truncate block max-w-[12rem]">{localFile.type || "Unknown"}</span>
                  </div>
                </div>

                {/* Storage Path */}
                <div className="flex items-start gap-2.5">
                  <FolderOpen className="h-4 w-4 text-ink-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-medium text-white">Storage Path</span>
                    <span className="text-ink-300 break-all">{localFile.path}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-ink-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-medium text-white">Created</span>
                    <span className="text-ink-300">{new Date(localFile.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-ink-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-medium text-white">Modified</span>
                    <span className="text-ink-300">{new Date(localFile.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/[0.06] my-5" />

              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">
                Quick Actions
              </h3>
              
              <div className="flex flex-col gap-2">
                {/* Star action */}
                <button
                  type="button"
                  onClick={toggleStar}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                    localFile.is_starred
                      ? "border-coral-500/20 bg-coral-500/5 text-coral-300 hover:bg-coral-500/10"
                      : "border-white/10 bg-white/[0.02] text-ink-200 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <Star className={cn("h-4 w-4", localFile.is_starred && "fill-coral-400 text-coral-400")} />
                  <span>{localFile.is_starred ? "Starred" : "Star File"}</span>
                </button>

                {/* Move to Trash action */}
                <button
                  type="button"
                  onClick={toggleTrash}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-xs transition-colors hover:border-coral-500/20",
                    localFile.is_trashed
                      ? "text-accent-300 hover:bg-accent-500/10"
                      : "text-coral-300 hover:bg-coral-500/10"
                  )}
                >
                  {localFile.is_trashed ? (
                    <>
                      <Undo className="h-4 w-4" />
                      <span>Restore File</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Move to Trash</span>
                    </>
                  )}
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
