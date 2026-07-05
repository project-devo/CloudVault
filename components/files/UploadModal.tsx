"use client";

import { useCallback, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Loader2,
  X,
} from "lucide-react";
import {
  DEFAULT_MAX_UPLOAD_SIZE,
  DEFAULT_STORAGE_QUOTA_BYTES,
  buildStoragePath,
  cn,
  formatBytes,
  generateId,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { UploadItem } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_SIZE = Number(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE ?? DEFAULT_MAX_UPLOAD_SIZE
);

function createRejectedUpload(rejection: FileRejection): UploadItem {
  return {
    id: generateId(),
    file: rejection.file,
    status: "error",
    progress: 0,
    error: rejection.errors.map((issue) => issue.message).join(". "),
  };
}

export default function UploadModal({ open, onClose }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder") ?? null;
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const isUploading = uploads.some((item) => item.status === "uploading");
  const successCount = uploads.filter((item) => item.status === "success").length;
  const errorCount = uploads.filter((item) => item.status === "error").length;

  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      const nextItems = acceptedFiles.map<UploadItem>((file) => ({
        id: generateId(),
        file,
        status: "pending",
        progress: 0,
      }));

      setSessionError(null);
      setAllDone(false);
      setUploads((prev) => [...prev, ...nextItems]);
      void uploadAll(nextItems);
    },
    [folderId]
  );

  const onDropRejected = useCallback((rejectedFiles: FileRejection[]) => {
    if (!rejectedFiles.length) return;

    setSessionError(null);
    setAllDone(true);
    setUploads((prev) => [
      ...prev,
      ...rejectedFiles.map((rejection) => createRejectedUpload(rejection)),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    onDropRejected,
    maxSize: MAX_SIZE,
    multiple: true,
  });

  async function uploadAll(items: UploadItem[]) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const error = "Your session expired. Sign in again and retry the upload.";
      setSessionError(error);
      setUploads((prev) =>
        prev.map((upload) =>
          items.some((item) => item.id === upload.id)
            ? { ...upload, status: "error", error }
            : upload
        )
      );
      setAllDone(true);
      return;
    }

    const { data: existingFiles, error: usageError } = await supabase
      .from("files")
      .select("size")
      .eq("user_id", user.id)
      .eq("is_trashed", false);

    if (usageError) {
      const error = "Could not verify available storage. Retry the upload.";
      setSessionError(error);
      setUploads((prev) =>
        prev.map((upload) =>
          items.some((item) => item.id === upload.id)
            ? { ...upload, status: "error", error }
            : upload
        )
      );
      setAllDone(true);
      return;
    }

    const usedBytes =
      existingFiles?.reduce((sum, file) => sum + Number(file.size ?? 0), 0) ?? 0;
    const pendingBytes = items.reduce((sum, item) => sum + item.file.size, 0);

    if (usedBytes + pendingBytes > DEFAULT_STORAGE_QUOTA_BYTES) {
      const remainingBytes = Math.max(
        DEFAULT_STORAGE_QUOTA_BYTES - usedBytes,
        0
      );
      const error = `Storage quota exceeded. ${formatBytes(
        remainingBytes
      )} left out of ${formatBytes(DEFAULT_STORAGE_QUOTA_BYTES)}.`;

      setUploads((prev) =>
        prev.map((upload) =>
          items.some((item) => item.id === upload.id)
            ? { ...upload, status: "error", error }
            : upload
        )
      );
      setAllDone(true);
      return;
    }

    await Promise.all(
      items.map(async (item) => {
        setUploads((prev) =>
          prev.map((upload) =>
            upload.id === item.id
              ? { ...upload, status: "uploading", error: undefined }
              : upload
          )
        );

        const storagePath = buildStoragePath(user.id, folderId, item.file.name);

        try {
          const { error: storageError } = await supabase.storage
            .from("user-files")
            .upload(storagePath, item.file, { upsert: false });

          if (storageError) {
            throw storageError;
          }

          const { error: dbError } = await supabase.from("files").insert({
            name: item.file.name,
            size: item.file.size,
            type: item.file.type || "application/octet-stream",
            path: storagePath,
            folder_id: folderId,
            user_id: user.id,
          });

          if (dbError) {
            await supabase.storage.from("user-files").remove([storagePath]);
            throw dbError;
          }

          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === item.id
                ? { ...upload, status: "success", progress: 100 }
                : upload
            )
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Upload failed";

          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === item.id
                ? { ...upload, status: "error", error: message }
                : upload
            )
          );
        }
      })
    );

    setAllDone(true);
  }

  function handleClose() {
    if (isUploading) return;
    if (successCount > 0) router.refresh();
    setUploads([]);
    setAllDone(false);
    setSessionError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="sheet-backdrop">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden
      />

      <div className="sheet relative" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              Upload Files
            </h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Max {formatBytes(MAX_SIZE)} per file · {formatBytes(DEFAULT_STORAGE_QUOTA_BYTES)} total
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full p-2 text-ink-300 transition-all duration-200 ease-apple hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close upload modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <div
            {...getRootProps()}
            data-active={isDragActive}
            className="dropzone"
          >
            <input {...getInputProps()} />
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
              <CloudUpload
                className={cn(
                  "h-6 w-6 transition-colors duration-200",
                  isDragActive ? "text-accent-200" : "text-ink-300"
                )}
              />
            </div>
            <p className="mb-1 font-medium text-white">
              {isDragActive ? "Drop files to upload" : "Drag and drop files here"}
            </p>
            <p className="text-xs text-ink-400">
              Tap to browse or drop files into the current folder.
            </p>
          </div>

          {sessionError && (
            <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-200 animate-slide-down">
              {sessionError}
            </div>
          )}

          {uploads.length > 0 && (
            <ul className="space-y-2">
              {uploads.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-ink-400">
                      {formatBytes(item.file.size)}
                    </p>
                    {item.error && (
                      <p className="mt-1 text-xs text-coral-300">
                        {item.error}
                      </p>
                    )}
                    {item.status === "uploading" && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full w-1/2 aurora-bg shimmer rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {item.status === "pending" && (
                      <div className="h-2 w-2 rounded-full bg-ink-500" />
                    )}
                    {item.status === "uploading" && (
                      <Loader2 className="h-4 w-4 animate-spin text-accent-300" />
                    )}
                    {item.status === "success" && (
                      <CheckCircle2 className="h-4 w-4 text-success-400" />
                    )}
                    {item.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-coral-400" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-5 py-4 sm:px-6">
          {allDone && uploads.length > 0 && (
            <div className="mb-3 text-sm animate-fade-in">
              {successCount > 0 && (
                <p className="text-success-300">
                  {successCount} file{successCount === 1 ? "" : "s"} uploaded successfully.
                </p>
              )}
              {errorCount > 0 && (
                <p className="mt-1 text-coral-300">
                  {errorCount} file{errorCount === 1 ? "" : "s"} failed.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleClose}
            disabled={isUploading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isUploading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            {isUploading ? "Uploading..." : allDone ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
