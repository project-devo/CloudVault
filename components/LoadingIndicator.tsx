"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/lib/useLoading";
import GlobalLoading from "./GlobalLoading";

export default function LoadingIndicator() {
  // `isLoading` is the shared context flag, set deliberately by auth flows
  // (login / signup / "Start for free") — those keep the rich full-screen loader.
  const { isLoading, setLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // `navPending` is local to this component and drives the slim top bar for
  // ordinary in-app link navigation, so dashboard nav never flashes the overlay.
  const [navPending, setNavPending] = useState(false);

  // Any completed navigation clears both loaders.
  useEffect(() => {
    setLoading(false);
    setNavPending(false);
  }, [pathname, searchParams, setLoading]);

  // Intercept internal anchor clicks for instant navigation feedback.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
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
          setNavPending(true);
        }
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      {/* Slim aurora progress bar for in-app navigation */}
      {navPending && (
        <div className="fixed inset-x-0 top-0 z-[130] h-[3px] overflow-hidden">
          <div
            className="h-full w-full animate-aurora-shift bg-gradient-to-r from-accent-500 via-coral-500 to-accent-500 shadow-[0_1px_10px_rgba(124,92,255,0.5)]"
            style={{ backgroundSize: "200% 200%" }}
          />
        </div>
      )}

      {/* Rich full-screen loader reserved for auth transitions */}
      {isLoading && <GlobalLoading label="Loading vault..." />}
    </>
  );
}
