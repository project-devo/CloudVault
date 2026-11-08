"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, Search, Upload, X } from "lucide-react";
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

  function handleClear() {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("q")) {
      params.delete("q");
      router.push(`/dashboard?${params.toString()}`);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 shrink-0 border-b border-ink-700 bg-ink-950/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <button
            onClick={onOpenNav}
            className="rounded-lg p-2 text-ink-300 transition-colors duration-200 ease-apple hover:bg-ink-800 hover:text-ink-50 active:scale-95 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <form
            onSubmit={handleSearch}
            className="order-3 w-full sm:order-none sm:flex-1"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search files and folders..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-full rounded-[10px] border border-transparent bg-ink-800 pl-9 pr-9 text-sm text-ink-50 placeholder:text-ink-400 transition-all duration-200 ease-apple hover:bg-ink-700/60 focus:border-accent-500 focus:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-accent-500/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-700/60 hover:text-ink-50"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
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
