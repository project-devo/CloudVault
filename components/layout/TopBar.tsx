"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, Search, Upload } from "lucide-react";
import UploadModal from "@/components/files/UploadModal";

interface Props {
  onOpenNav: () => void;
}

export default function TopBar({ onOpenNav }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="glass flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 shadow-soft-lg">
          <button
            onClick={onOpenNav}
            className="rounded-lg p-2 text-ink-300 transition-all duration-200 ease-apple hover:bg-white/[0.06] hover:text-white active:scale-95 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <form
            onSubmit={handleSearch}
            className="order-3 w-full sm:order-none sm:flex-1"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                placeholder="Search files and folders..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-full rounded-xl border border-transparent bg-white/[0.04] pl-9 pr-3 text-sm text-ink-50 placeholder:text-ink-400 transition-all duration-200 ease-apple hover:bg-white/[0.06] focus:border-accent-400/60 focus:bg-white/[0.06] focus:outline-none focus:shadow-[0_0_0_4px_rgba(124,92,255,0.15)]"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <button
              onClick={() => setUploadOpen(true)}
              className="btn-primary py-2 text-sm sm:py-1.5"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        </div>
      </header>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
