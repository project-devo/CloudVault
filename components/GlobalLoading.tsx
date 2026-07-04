"use client";

import { Cloud } from "lucide-react";

interface Props {
  label?: string;
}

export default function GlobalLoading({ label = "Loading..." }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-950/80 backdrop-blur-md animate-fade-in">
      {/* Ambient background glows */}
      <div 
        aria-hidden 
        className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center"
      >
        <div className="absolute h-80 w-80 rounded-full bg-accent-500/10 blur-3xl animate-pulse-soft" />
        <div className="absolute h-64 w-64 rounded-full bg-coral-500/8 blur-3xl animate-pulse-soft [animation-delay:1.2s]" />
      </div>

      <div className="relative flex flex-col items-center gap-5 animate-scale-in">
        {/* Floating Gloss Box with Glowing Border */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent-600 to-coral-500 text-white shadow-glow-accent ring-1 ring-white/20">
          {/* Inner pulse */}
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-pulse [animation-duration:2s]" />
          <Cloud className="h-8 w-8 text-white animate-bounce [animation-duration:2.5s]" />
        </div>

        {/* Loading text messages */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="aurora-text text-sm font-bold tracking-widest uppercase animate-pulse [animation-duration:1.8s]">
            {label}
          </span>
          <span className="text-[10px] tracking-wider text-ink-400 uppercase">
            Securing your vault
          </span>
        </div>
      </div>
    </div>
  );
}
