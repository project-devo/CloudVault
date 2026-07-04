"use client";

import { Download, FileQuestion } from "lucide-react";
import type { FileItem } from "@/types";
import { formatBytes } from "@/lib/utils";

interface Props {
  file: FileItem;
}

export default function UnsupportedPreview({ file }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">
        <FileQuestion className="h-7 w-7 text-ink-300" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">No preview available</p>
        <p className="mt-1 text-xs text-ink-400">
          {file.name} &middot; {formatBytes(file.size)}
        </p>
      </div>
      <a
        href={`/api/files/${file.id}?download=true`}
        className="btn-glass"
      >
        <Download className="h-4 w-4" />
        Download instead
      </a>
    </div>
  );
}
