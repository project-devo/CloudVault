"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, Check, WrapText, Search, Loader2, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fileId: string;
  shareId?: string;
  sharePassword?: string;
}

export default function CodePreview({ fileId, shareId, sharePassword }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setContent(null);
    setError(null);

    async function load() {
      try {
        const url = shareId
          ? `/api/shares/${shareId}/file?fileId=${fileId}`
          : `/api/files/${fileId}`;
        const headers: HeadersInit = {};
        if (shareId && sharePassword) headers["x-share-password"] = sharePassword;
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch file contents (${response.status})`);
        }
        const text = await response.text();
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fileId, shareId, sharePassword]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-ink-300">
        <Loader2 className="h-6 w-6 animate-spin text-accent-400" />
        <span>Loading file content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-coral-300">
        <AlertTriangle className="h-8 w-8 text-coral-400" />
        <div>
          <p className="font-semibold">Couldn&apos;t load code preview</p>
          <p className="mt-1 text-xs text-ink-400">{error}</p>
        </div>
      </div>
    );
  }

  const lines = content ? content.split("\n") : [];
  const charCount = content ? content.length : 0;

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const renderLineContent = (lineText: string) => {
    if (!searchQuery) return lineText;
    try {
      const escapedQuery = escapeRegExp(searchQuery);
      const parts = lineText.split(new RegExp(`(${escapedQuery})`, "gi"));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={i} className="bg-coral-500/40 text-white rounded-xs px-0.5 font-medium">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch {
      return lineText;
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-ink-950/40">
      {/* File Action/Stat Header */}
      <header className="flex flex-col gap-2 border-b border-white/[0.06] bg-ink-900/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-300">
            <FileText className="h-3.5 w-3.5" />
            <span>{lines.length} lines</span>
            <span className="text-ink-600">&middot;</span>
            <span>{charCount} characters</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Real-time search toggle */}
          {showSearch ? (
            <div className="relative flex items-center animate-scale-in">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find in file..."
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white placeholder:text-ink-500 focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearch(false);
                }}
                className="absolute right-2 text-ink-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="rounded-lg p-1.5 text-ink-300 hover:bg-white/[0.06] hover:text-white"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          <div className="h-4 w-px bg-white/10" />

          {/* Word wrap toggle */}
          <button
            type="button"
            onClick={() => setWordWrap(!wordWrap)}
            className={cn(
              "rounded-lg p-1.5 transition-colors hover:bg-white/[0.06]",
              wordWrap ? "text-accent-400 bg-white/[0.04]" : "text-ink-300 hover:text-white"
            )}
            title="Toggle Word Wrap"
          >
            <WrapText className="h-4 w-4" />
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-ink-200 hover:bg-white/[0.06] hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-accent-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Code Text Area */}
      <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="group hover:bg-white/[0.02]">
                  {/* Line Number Gutter */}
                  <td className="w-10 select-none border-r border-white/[0.04] pr-3 text-right text-ink-600 group-hover:text-ink-400">
                    {idx + 1}
                  </td>
                  {/* Code Line Content */}
                  <td
                    className={cn(
                      "pl-4 text-ink-200 whitespace-pre",
                      wordWrap ? "whitespace-pre-wrap break-all" : "overflow-x-auto"
                    )}
                  >
                    {renderLineContent(line)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
