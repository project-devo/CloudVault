'use client';

import Link from "next/link";
import { ArrowRight, Cloud, Globe, Shield, Zap } from "lucide-react";
import { useLoading } from "@/lib/useLoading";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: Shield,
    title: "End-to-end secure",
    desc: "Row-level security ensures only you access your files.",
  },
  {
    icon: Zap,
    title: "Instant uploads",
    desc: "Direct to Supabase Storage. No middle-man slowing you down.",
  },
  {
    icon: Globe,
    title: "Access anywhere",
    desc: "Browser-based. Open your vault from any device, any OS.",
  },
];

export default function HomePage() {
  const { isLoading, setLoading } = useLoading();
  const router = useRouter();

  const handleGetStartedClick = async () => {
    setLoading(true);

    try {
      await router.push('/auth/signup');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="border-b border-ink-700">
        <nav className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="font-serif text-xl font-semibold italic tracking-tight text-ink-50"
          >
            CloudVault
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="btn-ghost">
              Sign in
            </Link>
            <button
              onClick={handleGetStartedClick}
              disabled={isLoading}
              className="btn-primary group"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">
                    <Cloud className="h-4 w-4" />
                  </span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  Start for free
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-apple group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-24 pt-14 sm:px-8 sm:pt-24">
        <div className="max-w-2xl">
          <p className="animate-fade-in text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-400">
            1 GB free — no credit card
          </p>

          <h1 className="mb-6 mt-5 text-5xl font-semibold leading-[1.02] tracking-tight text-ink-50 [word-spacing:0.06em] sm:text-6xl md:text-7xl">
            <span className="reveal-line">
              <span>Your files,</span>
            </span>
            <span className="reveal-line">
              <span className="text-balance italic">everywhere you are</span>
            </span>
          </h1>

          <p className="mb-10 max-w-xl animate-slide-up text-pretty font-serif text-lg italic leading-relaxed text-ink-300 [animation-delay:0.25s] sm:text-xl">
            Upload, organize, and share files securely. Built on Supabase — your
            data stays yours.
          </p>

          <div className="flex animate-slide-up flex-col items-start gap-4 [animation-delay:0.35s] sm:flex-row sm:items-center sm:gap-7">
            <Link href="/auth/signup" className="btn-primary group px-6 py-3 text-base">
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-apple group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="border-b border-ink-50 pb-0.5 text-sm font-medium text-ink-50 transition-opacity duration-200 hover:opacity-60"
            >
              I have an account
            </Link>
          </div>
        </div>

        <div className="safe-stagger mt-20 grid gap-x-10 gap-y-10 border-t-[1.5px] border-ink-50 pt-8 sm:mt-28 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <Icon className="mb-4 h-5 w-5 text-accent-400" strokeWidth={1.25} />
              <h3 className="mb-1.5 font-serif text-lg font-semibold tracking-tight text-ink-50">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-300">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-ink-700 py-6 text-center text-xs text-ink-400">
        CloudVault — built with Next.js 14 + Supabase
      </footer>
    </div>
  );
}
