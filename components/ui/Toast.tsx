"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastItem } from "@/lib/useToast";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const ACCENT = {
  success: "text-success-400",
  error: "text-coral-400",
  info: "text-accent-300",
} as const;

interface Props {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export default function Toast({ toast, onDismiss }: Props) {
  const Icon = ICONS[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass pointer-events-auto flex w-full items-start gap-3 rounded-2xl px-4 py-3 shadow-soft-lg animate-slide-up"
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", ACCENT[toast.type])} />
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-100">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
