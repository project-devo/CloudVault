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
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3 sm:h-14 sm:flex-nowrap sm:px-6 sm:py-0">
        <button
          onClick={onOpenNav}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearch} className="order-3 w-full sm:order-none sm:flex-1 sm:max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              placeholder="Search files and folders..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input h-10 w-full pl-9 text-sm sm:h-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="btn-primary flex items-center gap-2 py-2 text-sm sm:py-1.5"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </header>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
