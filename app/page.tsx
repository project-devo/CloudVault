'use client';

import Link from "next/link";
import { Cloud, Globe, Shield, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useLoading } from "@/lib/useLoading";
import { useRouter } from "next/navigation";

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
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Aurora background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-[-10%] h-[520px] w-[520px] rounded-full bg-accent-500/30 blur-3xl animate-pulse-soft" />
        <div className="absolute right-[-12%] top-[-5%] h-[480px] w-[480px] rounded-full bg-coral-500/25 blur-3xl animate-pulse-soft [animation-delay:1.2s]" />
        <div className="absolute left-1/2 top-[35%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent-400/15 blur-3xl" />
      </div>

      {/* Global loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-2xl">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="ml-2 text-white">Loading...</span>
          </div>
        </div>
      )}

      <nav className="relative z-10 flex items-center justify-between gap-3 px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl aurora-bg shadow-glow-accent">
            <Cloud className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            CloudVault
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="btn-ghost">
            Sign in
          </Link>
          <button
            onClick={handleGetStartedClick}
            disabled={isLoading}
            className={`btn-primary group w-full px-7 py-3 text-base sm:w-auto ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <span className="mr-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
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

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-24 pt-16 text-center sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl animate-fade-in">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-accent-300" />
            <span className="text-sm font-medium text-ink-100">
              1 GB free — no credit card
            </span>
          </div>

          <h1 className="mb-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tightest text-white sm:text-6xl md:text-7xl">
            Your files,
            <br className="hidden sm:block" />{" "}
            <span className="aurora-text">everywhere you are</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-pretty text-lg leading-relaxed text-ink-300 sm:text-xl">
            Upload, organize, and share files securely. Built on Supabase — your
            data stays yours.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/auth/signup"
              className="btn-primary group w-full px-7 py-3 text-base sm:w-auto"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-apple group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="btn-glass w-full px-6 py-3 text-base sm:w-auto"
            >
              I have an account
            </Link>
          </div>
        </div>

        <div className="safe-stagger mt-20 grid w-full max-w-5xl grid-cols-1 gap-4 sm:mt-28 sm:grid-cols-3">
          {[
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
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-interactive p-6 text-left">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
                <Icon className="h-5 w-5 text-accent-200" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-white">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-300">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-sm text-ink-400">
        CloudVault — built with Next.js 14 + Supabase
      </footer>
    </div>
  );
}
