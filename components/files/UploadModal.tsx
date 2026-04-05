"use client";

import { useCallback, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-white">Upload Files</h2>
            <p className="mt-1 text-xs text-gray-500">
              Max {formatBytes(MAX_SIZE)} per file, {formatBytes(DEFAULT_STORAGE_QUOTA_BYTES)} total
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-500 transition-colors hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close upload modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div
            {...getRootProps()}
            className={cn(
              "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all sm:p-8",
              isDragActive
                ? "border-brand-500 bg-brand-500/5"
                : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
            )}
          >
            <input {...getInputProps()} />
            <CloudUpload
              className={cn(
                "mx-auto mb-3 h-12 w-12",
                isDragActive ? "text-brand-500" : "text-gray-600"
              )}
            />
            <p className="mb-1 font-medium text-white">
              {isDragActive ? "Drop files to upload" : "Drag and drop files here"}
            </p>
            <p className="text-xs text-gray-500">
              Tap to browse or drop files into the current folder.
            </p>
          </div>

          {sessionError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {sessionError}
            </div>
          )}

          {uploads.length > 0 && (
            <div className="space-y-2">
              {uploads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-800 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(item.file.size)}
                    </p>
                    {item.error && (
                      <p className="mt-1 text-xs text-red-300">{item.error}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {item.status === "pending" && (
                      <div className="h-4 w-4 rounded-full bg-gray-600" />
                    )}
                    {item.status === "uploading" && (
                      <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                    )}
                    {item.status === "success" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {item.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 px-4 py-4 sm:px-6">
          {allDone && uploads.length > 0 && (
            <div className="mb-3 text-sm">
              {successCount > 0 && (
                <p className="text-green-400">
                  {successCount} file{successCount === 1 ? "" : "s"} uploaded successfully.
                </p>
              )}
              {errorCount > 0 && (
                <p className="mt-1 text-red-400">
                  {errorCount} file{errorCount === 1 ? "" : "s"} failed.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleClose}
            disabled={isUploading}
            className={cn(
              "btn-primary w-full",
              allDone && successCount > 0 && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isUploading ? "Uploading..." : allDone ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
