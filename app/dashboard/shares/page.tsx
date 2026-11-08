"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Lock,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/lib/useToast";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
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

const TH =
  "px-1 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-300";
const BADGE =
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium";

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) {
    return (
      <span className={cn(BADGE, "bg-ink-800 text-ink-300")}>
        <Clock className="h-3 w-3" /> Never
      </span>
    );
  }
  const expired = isExpired(expiresAt);
  return (
    <span
      className={cn(
        BADGE,
        expired
          ? "bg-coral-500/10 text-coral-300"
          : "bg-success-500/10 text-success-300"
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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">Shared Links</h1>
          <p className="mt-1.5 text-sm text-ink-400">
            {shares.length} active link{shares.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => void fetchShares()}
          className="btn-outline"
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
        <div className="flex flex-1 flex-col items-center justify-center border-y border-ink-700 py-20 text-center">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-tint-sand text-ink-100">
            <Link2 className="h-6 w-6" strokeWidth={1.25} />
          </div>
          <h3 className="mb-1 font-serif text-xl font-semibold tracking-tight text-ink-50">No shared links yet</h3>
          <p className="text-sm text-ink-300">
            Right-click any file or folder and choose &ldquo;Share&rdquo; to create a link.
          </p>
        </div>
      )}

      {/* Shares list */}
      {!loading && shares.length > 0 && (
        <div className="border-b border-ink-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-[1.5px] border-ink-50">
                <th className={cn(TH, "text-ink-50")}>Resource</th>
                <th className={cn(TH, "hidden px-3 md:table-cell")}>Security</th>
                <th className={cn(TH, "hidden px-3 lg:table-cell")}>Expires</th>
                <th className={cn(TH, "hidden px-3 xl:table-cell")}>Created</th>
                <th className={cn(TH, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody className="safe-stagger divide-y divide-ink-700">
              {shares.map((share) => {
                const name = share.file?.name ?? share.folder?.name ?? "Unknown";
                const isFolder = Boolean(share.folder_id);
                const expired = isExpired(share.expires_at);

                return (
                  <tr
                    key={share.id}
                    className={cn(
                      "group transition-colors duration-200 hover:bg-ink-800/60",
                      expired && "opacity-60"
                    )}
                  >
                    {/* Resource */}
                    <td className="px-1 py-2.5">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon folder={isFolder} mime={share.file?.type} />
                        <div className="min-w-0">
                          <span className="block truncate font-serif text-[15px] font-semibold tracking-tight text-ink-50">{name}</span>
                          <span className="text-xs capitalize text-ink-400">{isFolder ? "Folder" : "File"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Security */}
                    <td className="hidden px-3 py-2.5 md:table-cell">
                      {share.has_password ? (
                        <span className={cn(BADGE, "bg-tint-butter text-ink-100")}>
                          <Lock className="h-3 w-3" /> Password
                        </span>
                      ) : (
                        <span className={cn(BADGE, "bg-ink-800 text-ink-400")}>
                          Public
                        </span>
                      )}
                    </td>

                    {/* Expires */}
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      <ExpiryBadge expiresAt={share.expires_at} />
                    </td>

                    {/* Created */}
                    <td className="hidden px-3 py-2.5 text-ink-300 xl:table-cell">
                      {formatDate(share.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-1 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* Copy link */}
                        <button
                          onClick={() => void handleCopy(share.id)}
                          className="rounded-lg p-1.5 text-ink-400 transition-all hover:bg-ink-800 hover:text-ink-50"
                          title="Copy link"
                          aria-label="Copy share link"
                        >
                          {copied === share.id ? (
                            <Check className="h-4 w-4 text-success-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>

                        {/* Open in new tab */}
                        <a
                          href={`/share/${share.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-ink-400 transition-all hover:bg-ink-800 hover:text-ink-50"
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
                          className="rounded-lg p-1.5 text-ink-400 transition-all hover:bg-ink-800 hover:text-ink-50"
                          title="Edit link settings"
                          aria-label="Edit share settings"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>

                        {/* Revoke */}
                        <button
                          onClick={() => void handleRevoke(share.id)}
                          disabled={revoking === share.id}
                          className="rounded-lg p-1.5 text-coral-400/80 transition-all hover:bg-coral-500/10 hover:text-coral-300 disabled:opacity-50"
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
