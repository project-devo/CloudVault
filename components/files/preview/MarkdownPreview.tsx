"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  fileId: string;
}

export default function MarkdownPreview({ fileId }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setError(null);

    async function load() {
      try {
        const response = await fetch(`/api/files/${fileId}`);
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
  }, [fileId]);

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

  return (
    <div className="markdown-body h-full overflow-auto p-6 text-sm leading-relaxed text-ink-100">
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
                  className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[0.85em] text-accent-200"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block overflow-auto rounded-lg bg-ink-950/80 p-3 font-mono text-[0.85em] text-ink-100"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-3 overflow-auto rounded-xl border border-white/[0.06] bg-ink-950/60 p-3">
              {children}
            </pre>
          ),
          h1: ({ children }) => (
            <h1 className="mb-3 mt-4 text-2xl font-semibold text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-xl font-semibold text-white">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-lg font-semibold text-white">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-accent-400/60 bg-white/[0.03] px-4 py-2 italic text-ink-200">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-auto rounded-lg border border-white/[0.06]">
              <table className="w-full text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-white/[0.08] bg-white/[0.04] px-3 py-2 font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/[0.04] px-3 py-2 text-ink-200">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
