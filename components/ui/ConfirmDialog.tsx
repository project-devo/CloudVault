"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop">
      <div
        className="absolute inset-0"
        onClick={() => !loading && onClose()}
        aria-hidden
      />
      <div
        className="sheet-sm relative"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="p-6">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-500/15 ring-1 ring-inset ring-coral-500/25">
            <AlertTriangle className="h-5 w-5 text-coral-300" />
          </div>
          <h2 className="mb-1.5 text-base font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-ink-300">{message}</p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-glass flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-coral-600 to-coral-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow-coral transition-all duration-300 ease-apple hover:saturate-[1.05] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-300/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Working..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
