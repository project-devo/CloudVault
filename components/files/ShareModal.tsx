"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Lock,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/useToast";

export interface ShareTarget {
  kind: "file" | "folder";
  id: string;
  name: string;
}

interface Props {
  target: ShareTarget | null;
  onClose: () => void;
}

type ExpiryOption = "never" | "1d" | "7d" | "30d" | "custom";

const EXPIRY_OPTIONS: { value: ExpiryOption; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "1d", label: "1 Day" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "custom", label: "Custom date" },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function ShareModal({ target, onClose }: Props) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  // Form state
  const [expiry, setExpiry] = useState<ExpiryOption>("never");
  const [customDate, setCustomDate] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Result state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when target changes
  useEffect(() => {
    if (target) {
      setExpiry("never");
      setCustomDate("");
      setPassword("");
      setShowPassword(false);
      setShareUrl(null);
      setShareId(null);
      setHasPassword(false);
      setCopied(false);

      // Check if share already exists for this resource
      void checkExistingShare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  async function checkExistingShare() {
    if (!target) return;
    try {
      const res = await fetch("/api/shares");
      if (!res.ok) return;
      const { data } = await res.json();
      const existing = (data ?? []).find((s: any) =>
        target.kind === "file" ? s.file_id === target.id : s.folder_id === target.id
      );
      if (existing) {
        const appUrl = window.location.origin;
        setShareUrl(`${appUrl}/share/${existing.id}`);
        setShareId(existing.id);
        setHasPassword(existing.has_password ?? false);
      }
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    if (!target) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [target, onClose]);

  function computeExpiresAt(): string | null {
    if (expiry === "never") return null;
    if (expiry === "1d") return addDays(1);
    if (expiry === "7d") return addDays(7);
    if (expiry === "30d") return addDays(30);
    if (expiry === "custom" && customDate) return new Date(customDate).toISOString();
    return null;
  }

  async function handleCreate() {
    if (!target) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        [target.kind === "file" ? "file_id" : "folder_id"]: target.id,
        expires_at: computeExpiresAt(),
      };
      if (password) body.password = password;

      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create link");
        return;
      }
      const appUrl = window.location.origin;
      setShareUrl(`${appUrl}/share/${json.data.id}`);
      setShareId(json.data.id);
      setHasPassword(json.data.has_password);
      toast.success("Share link created!");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!shareId) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/shares/${shareId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to revoke link");
        return;
      }
      setShareUrl(null);
      setShareId(null);
      setHasPassword(false);
      setPassword("");
      toast.success("Link revoked");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setRevoking(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!mounted || !target) return null;

  const today = new Date().toISOString().slice(0, 10);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${target.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card relative w-full max-w-md rounded-2xl shadow-soft-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-ink-900/60 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl aurora-bg shadow-glow-accent shrink-0">
            <Share2 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              Share &ldquo;{target.name}&rdquo;
            </p>
            <p className="text-xs text-ink-400 capitalize">{target.kind} link</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Existing link display */}
          {shareUrl ? (
            <div className="space-y-3">
              {/* Active link banner */}
              <div className="flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-3 py-2.5">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-accent-300" />
                <span className="flex-1 truncate text-xs font-mono text-accent-200">
                  {shareUrl}
                </span>
              </div>

              {hasPassword && (
                <div className="flex items-center gap-2 text-xs text-ink-300">
                  <Lock className="h-3 w-3 text-coral-400" />
                  Password protected
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={cn(
                    "btn-glass flex-1 justify-center text-sm",
                    copied && "text-emerald-300"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy link
                    </>
                  )}
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex items-center gap-1.5 rounded-xl border border-coral-500/30 bg-coral-500/10 px-3 py-2 text-sm text-coral-300 transition-colors hover:bg-coral-500/20 hover:text-coral-200 disabled:opacity-50"
                >
                  {revoking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Revoke
                </button>
              </div>

              <div className="h-px bg-white/[0.05]" />
              <p className="text-xs text-ink-400">
                Regenerate with new settings — this will replace the existing link.
              </p>
            </div>
          ) : null}

          {/* Settings */}
          <div className="space-y-4">
            {/* Expiration */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-200">
                <Clock className="h-3.5 w-3.5 text-ink-400" />
                Link Expiration
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiry(opt.value)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200",
                      expiry === opt.value
                        ? "aurora-bg text-white shadow-glow-accent"
                        : "bg-white/[0.04] text-ink-300 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {expiry === "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                  <input
                    type="date"
                    min={today}
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-ink-100 focus:border-accent-400/60 focus:outline-none focus:bg-white/[0.06]"
                  />
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-200">
                <Lock className="h-3.5 w-3.5 text-ink-400" />
                Password Protection
                <span className="ml-1 text-ink-500">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave empty for no password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-3 pr-9 text-sm text-ink-100 placeholder:text-ink-500 transition-all focus:border-accent-400/60 focus:bg-white/[0.06] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={loading || (expiry === "custom" && !customDate)}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {shareUrl ? "Regenerate Link" : "Create Share Link"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
