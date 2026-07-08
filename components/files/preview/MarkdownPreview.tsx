"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Eye, Code, Copy, Check, WrapText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fileId: string;
  shareId?: string;
  sharePassword?: string;
}

export default function MarkdownPreview({ fileId, shareId, sharePassword }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  useEffect(() => {
    let cancelled = false;
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
          throw new Error(`Failed to fetch file (${response.status})`);
        }
        const text = await response.text();
        if (!cancelled) {
          setContent(text);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fileId, shareId, sharePassword]);

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

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-coral-300">
        Couldn&apos;t load preview: {error}
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-300">
        Loading markdown...
      </div>
    );
  }

  const lines = content.split("\n");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-ink-950/20">
      {/* Markdown Action Header */}
      <header className="flex flex-col gap-2 border-b border-white/[0.06] bg-ink-900/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-ink-400">
          <FileText className="h-3.5 w-3.5" />
          <span>{lines.length} lines</span>
          <span className="text-ink-600">&middot;</span>
          <span>{content.length} characters</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Render vs Source Toggle */}
          <div className="segmented-text">
            <button
              type="button"
              data-active={viewMode === "preview"}
              onClick={() => setViewMode("preview")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs"
              aria-label="Preview rendered markdown"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              data-active={viewMode === "source"}
              onClick={() => setViewMode("source")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs"
              aria-label="View raw markdown source"
            >
              <Code className="h-3.5 w-3.5" />
              <span>Raw</span>
            </button>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {viewMode === "source" && (
            <>
              <button
                type="button"
                onClick={() => setWordWrap(!wordWrap)}
                className={cn(
                  "rounded-lg p-1.5 transition-colors hover:bg-white/[0.06]",
                  wordWrap ? "text-accent-400 bg-white/[0.04]" : "text-ink-300 hover:text-white"
                )}
                title="Toggle Word Wrap"
              >
                <WrapText className="h-3.5 w-3.5" />
              </button>
              <div className="h-4 w-px bg-white/10" />
            </>
          )}

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

      {/* Main View Area */}
      <div className="min-h-0 flex-1 overflow-auto">
        {viewMode === "preview" ? (
          <div className="markdown-body p-6 sm:p-8 text-sm leading-relaxed text-ink-100 max-w-4xl mx-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-300 underline underline-offset-2 hover:text-accent-200"
                  />
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.85em] text-accent-200"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className="block overflow-auto rounded-lg bg-ink-950/80 p-4 font-mono text-[0.85em] text-ink-100 border border-white/[0.04]"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="my-4 overflow-auto rounded-xl border border-white/[0.06] bg-ink-950/60 p-4">
                    {children}
                  </pre>
                ),
                h1: ({ children }) => (
                  <h1 className="mb-4 mt-6 text-2xl font-bold text-white border-b border-white/[0.06] pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-6 text-xl font-semibold text-white border-b border-white/[0.04] pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-3 mt-5 text-lg font-semibold text-white">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="my-3 list-disc space-y-1.5 pl-6">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-3 list-decimal space-y-1.5 pl-6">{children}</ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-4 border-l-4 border-accent-500 bg-white/[0.02] px-4 py-2.5 italic text-ink-300 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-4 overflow-auto rounded-lg border border-white/[0.06] bg-ink-900/20">
                    <table className="w-full text-left text-sm border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border-b border-white/[0.08] bg-white/[0.04] px-4 py-2.5 font-semibold text-white">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-b border-white/[0.04] px-4 py-2 text-ink-300">
                    {children}
                  </td>
                ),
                hr: () => (
                  <hr className="my-6 border-white/[0.08]" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-4 font-mono text-xs leading-relaxed">
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.02]">
                      <td className="w-10 select-none border-r border-white/[0.04] pr-3 text-right text-ink-600 group-hover:text-ink-400">
                        {idx + 1}
                      </td>
                      <td
                        className={cn(
                          "pl-4 text-ink-200 whitespace-pre",
                          wordWrap ? "whitespace-pre-wrap break-all" : "overflow-x-auto"
                        )}
                      >
                        {line}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
