"use client";

import { Folder, LayoutGrid, List, MoreVertical } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="relative flex h-full flex-col animate-pulse-soft">
      {/* Top Shifting Aurora Progress Line Bar */}
      <div 
        className="absolute top-[-16px] sm:top-[-24px] lg:top-[-32px] left-[-16px] sm:left-[-24px] lg:left-[-32px] right-[-16px] sm:right-[-24px] lg:right-[-32px] h-[3px] bg-gradient-to-r from-accent-500 via-coral-500 to-accent-500 animate-aurora-shift z-30 shadow-[0_1px_10px_rgba(124,92,255,0.4)]"
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* Header Info Skeleton */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {/* Breadcrumbs path */}
          <div className="h-4 w-32 rounded bg-white/[0.04]" />
          {/* Files / folder counts */}
          <div className="h-3.5 w-48 rounded bg-white/[0.03]" />
        </div>

        {/* View togglers */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-full bg-white/[0.04]" />
          <div className="segmented opacity-40">
            <button type="button" aria-label="Grid"><LayoutGrid className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="List"><List className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Grid boxes skeletons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {/* 3 mock folders */}
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={`folder-${idx}`} className="card p-4 flex flex-col gap-3 border-white/[0.04] bg-ink-900/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0">
              <Folder className="h-5 w-5 text-ink-500" />
            </div>
            <div className="h-4 w-2/3 rounded bg-white/[0.04]" />
            <div className="h-3 w-1/3 rounded bg-white/[0.03]" />
          </div>
        ))}

        {/* 8 mock files */}
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={`file-${idx}`} className="card p-4 flex flex-col justify-between h-36 border-white/[0.04] bg-ink-900/30">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/[0.06]" />
              <button className="text-white/10 p-1 cursor-default"><MoreVertical className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 mt-auto">
              <div className="h-4 w-5/6 rounded bg-white/[0.04]" />
              <div className="h-3 w-1/4 rounded bg-white/[0.03]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
