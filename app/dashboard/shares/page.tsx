"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  File,
  Folder,
  Link2,
  Loader2,
  Lock,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/lib/useToast";
import ShareModal, { type ShareTarget } from "@/components/files/ShareModal";

interface ShareRow {
  id: string;
  file_id: string | null;
  folder_id: string | null;
  has_password: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  file?: { id: string; name: string; type: string; size: number } | null;
  folder?: { id: string; name: string } | null;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-300">
        <Clock className="h-3 w-3" /> Never
      </span>
    );
  }
  const expired = isExpired(expiresAt);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        expired
          ? "bg-coral-500/15 text-coral-300"
          : "bg-emerald-500/15 text-emerald-300"
      )}
    >
      {expired ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
      {expired ? "Expired" : formatDate(expiresAt)}
    </span>
  );
}

export default function SharesPage() {
  const toast = useToast();
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ShareTarget | null>(null);

  async function fetchShares() {
    setLoading(true);
    try {
      const res = await fetch("/api/shares");
      const json = await res.json();
      setShares(json.data ?? []);
    } catch {
      toast.error("Failed to load shared links.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`/api/shares/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to revoke link");
        return;
      }
      setShares((prev) => prev.filter((s) => s.id !== id));
      toast.success("Link revoked");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setRevoking(null);
    }
  }

  async function handleCopy(id: string) {
    const url = `${window.location.origin}/share/${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Shared Links</h1>
          <p className="mt-0.5 text-sm text-ink-400">
            {shares.length} active link{shares.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => void fetchShares()}
          className="btn-glass"
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && shares.length === 0 && (
        <div className="card flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-coral-500/20 text-3xl ring-1 ring-inset ring-white/10">
            <Link2 className="h-7 w-7 text-accent-300" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-white">No shared links yet</h3>
          <p className="text-sm text-ink-300">
            Right-click any file or folder and choose &ldquo;Share&rdquo; to create a link.
          </p>
        </div>
      )}

      {/* Shares list */}
      {!loading && shares.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400">
                  Resource
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 md:table-cell">
                  Security
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 lg:table-cell">
                  Expires
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 xl:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {shares.map((share) => {
                const name = share.file?.name ?? share.folder?.name ?? "Unknown";
                const isFolder = Boolean(share.folder_id);
                const expired = isExpired(share.expires_at);

                return (
                  <tr
                    key={share.id}
                    className={cn(
                      "group transition-colors duration-200 hover:bg-white/[0.03]",
                      expired && "opacity-60"
                    )}
                  >
                    {/* Resource */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
                          {isFolder ? (
                            <Folder className="h-4 w-4 text-accent-200" />
                          ) : (
                            <File className="h-4 w-4 text-ink-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-white">{name}</span>
                          <span className="text-xs capitalize text-ink-500">{isFolder ? "Folder" : "File"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Security */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      {share.has_password ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                          <Lock className="h-3 w-3" /> Password
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-ink-400">
                          Public
                        </span>
                      )}
                    </td>

                    {/* Expires */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <ExpiryBadge expiresAt={share.expires_at} />
                    </td>

                    {/* Created */}
                    <td className="hidden px-4 py-3 text-ink-300 xl:table-cell">
                      {formatDate(share.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Copy link */}
                        <button
                          onClick={() => void handleCopy(share.id)}
                          className="rounded-lg p-1.5 text-ink-400 transition-all hover:bg-white/[0.06] hover:text-white"
                          title="Copy link"
                          aria-label="Copy share link"
                        >
                          {copied === share.id ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>

                        {/* Open in new tab */}
                        <a
                          href={`/share/${share.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-ink-400 transition-all hover:bg-white/[0.06] hover:text-white"
                          title="Open link"
                          aria-label="Open share link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>

                        {/* Edit / Regenerate */}
                        <button
                          onClick={() =>
                            setEditTarget({
                              kind: isFolder ? "folder" : "file",
                              id: (share.file_id ?? share.folder_id)!,
                              name,
                            })
                          }
                          className="rounded-lg p-1.5 text-ink-400 transition-all hover:bg-white/[0.06] hover:text-white"
                          title="Edit link settings"
                          aria-label="Edit share settings"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>

                        {/* Revoke */}
                        <button
                          onClick={() => void handleRevoke(share.id)}
                          disabled={revoking === share.id}
                          className="rounded-lg p-1.5 text-coral-400/70 transition-all hover:bg-coral-500/10 hover:text-coral-300 disabled:opacity-50"
                          title="Revoke link"
                          aria-label="Revoke share link"
                        >
                          {revoking === share.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      <ShareModal
        target={editTarget}
        onClose={() => {
          setEditTarget(null);
          void fetchShares();
        }}
      />
    </div>
  );
}
