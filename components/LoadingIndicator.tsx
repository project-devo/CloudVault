"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/lib/useLoading";
import GlobalLoading from "./GlobalLoading";

export default function LoadingIndicator() {
  const { isLoading, setLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading state when pathname or searchParams change (navigation completes)
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams, setLoading]);

  // Intercept standard anchor link clicks for instant loader feedback
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        
        // Verify it is an internal link and not opening in new tab
        if (
          href &&
          href.startsWith("/") &&
          anchor.target !== "_blank" &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey
        ) {
          const currentUrl = window.location.pathname + window.location.search;
          if (href !== currentUrl) {
            setLoading(true);
          }
        }
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [setLoading]);

  if (!isLoading) return null;

  return <GlobalLoading label="Loading vault..." />;
}
