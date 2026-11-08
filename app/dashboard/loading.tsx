"use client";

import { LayoutGrid, List } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col animate-pulse-soft">
      {/* Title + counts */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="h-9 w-48 rounded-md bg-ink-800" />
          <div className="h-3.5 w-40 rounded bg-ink-800/70" />
        </div>

        {/* View togglers */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 rounded-[10px] bg-ink-800" />
          <div className="segmented opacity-40">
            <button type="button" aria-label="Grid"><LayoutGrid className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="List"><List className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Row skeletons */}
      <div className="border-t border-ink-700">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 border-b border-ink-700 px-1 py-3"
          >
            <div className="h-[34px] w-[34px] shrink-0 rounded-lg bg-ink-800" />
            <div className="h-4 w-1/3 rounded bg-ink-800" />
            <div className="ml-auto hidden h-3 w-16 rounded bg-ink-800/70 md:block" />
            <div className="hidden h-3 w-20 rounded bg-ink-800/70 lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
