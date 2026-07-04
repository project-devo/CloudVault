"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, FolderPlus, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  currentFolderId: string | null;
}

export default function CreateFolderModal({
  open,
  onClose,
  currentFolderId,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), parent_id: currentFolderId }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Failed to create folder");
      setLoading(false);
    } else {
      setName("");
      setLoading(false);
      onClose();
      router.refresh();
    }
  }

  function handleClose() {
    setName("");
    setError(null);
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
      <div
        className="sheet-sm relative"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
              <FolderPlus className="h-3.5 w-3.5 text-accent-200" />
            </div>
            New Folder
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-ink-300 transition-all duration-200 ease-apple hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-100">
              Folder name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Project Assets"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="input"
            />
          </div>
          {error && (
            <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-200 animate-slide-down">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="btn-glass flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-1.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
