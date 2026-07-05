"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/lib/useToast";

export interface RenameTarget {
  id: string;
  name: string;
  kind: "file" | "folder";
}

interface Props {
  target: RenameTarget | null;
  onClose: () => void;
}

export default function RenameModal({ target, onClose }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(target?.name ?? "");
    setError(null);
  }, [target]);

  if (!target) return null;

  const label = target.kind === "folder" ? "folder" : "file";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === target.name) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    const res =
      target.kind === "folder"
        ? await fetch("/api/folders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: target.id, name: trimmed }),
          })
        : await fetch(`/api/files/${target.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmed }),
          });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Rename failed.");
      return;
    }

    toast.success(`Renamed to "${trimmed}"`);
    onClose();
    router.refresh();
  }

  return (
    <div className="sheet-backdrop">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="sheet-sm relative" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
              <Pencil className="h-3.5 w-3.5 text-accent-200" />
            </div>
            Rename {label}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-300 transition-all duration-200 ease-apple hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-100">
              Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => e.target.select()}
              maxLength={200}
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
              onClick={onClose}
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
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
