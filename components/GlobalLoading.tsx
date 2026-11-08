"use client";

import { Cloud } from "lucide-react";

interface Props {
  label?: string;
}

export default function GlobalLoading({ label = "Loading..." }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-950/90 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-5 animate-scale-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-ink-700 bg-ink-900 text-accent-400">
          <Cloud className="h-6 w-6 animate-pulse-soft" strokeWidth={1.25} />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-serif text-lg italic text-ink-50">{label}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Securing your vault
          </span>
        </div>
      </div>
    </div>
  );
}
