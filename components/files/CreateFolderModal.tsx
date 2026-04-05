"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, FolderPlus, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  currentFolderId: string | null;
}

export default function CreateFolderModal({ open, onClose, currentFolderId }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-brand-500" />
            New Folder
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Folder name</label>
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
            <p className="text-sm text-red-400">{error}</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={handleClose} className="btn-ghost flex-1 text-center">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
