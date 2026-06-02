import Link from "next/link";
import { Cloud, Globe, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gray-950">
      <nav className="flex flex-col items-center justify-between gap-3 border-b border-gray-800 px-4 py-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Cloud className="h-7 w-7 text-brand-500" />
          <span className="text-xl font-bold text-white">CloudVault</span>
        </div>
        <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:gap-3">
          <Link href="/auth/login" className="btn-ghost px-3 py-2 text-sm">
            Sign in
          </Link>
          <Link href="/auth/signup" className="btn-primary px-3 py-2 text-sm sm:px-4">
            Get started free
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <div className="mx-auto max-w-3xl animate-fade-in">
          <div className="mb-8 inline-flex max-w-full items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5">
            <Zap className="h-4 w-4 shrink-0 text-brand-500" />
            <span className="text-sm font-medium text-brand-500">
              1 GB free storage — no credit card
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            <span className="block">Your files,</span>
            <span className="mx-auto block max-w-[10ch] text-brand-500 sm:max-w-none">
              everywhere you are
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-gray-400 sm:text-xl">
            Upload, organize, and share files securely. Built on Supabase — your
            data stays yours.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/auth/signup"
              className="btn-primary w-full px-8 py-3 text-base sm:w-auto"
            >
              Start for free →
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-gray-400 transition-colors hover:text-white sm:text-base"
            >
              Already have an account?
            </Link>
          </div>
        </div>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-6 md:mt-24 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "End-to-end secure",
              desc: "Row-level security ensures only you access your files.",
            },
            {
              icon: Zap,
              title: "Instant uploads",
              desc: "Direct-to-Supabase Storage. No middle-man slowing you down.",
            },
            {
              icon: Globe,
              title: "Access anywhere",
              desc: "Browser-based. Open your vault from any device, any OS.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card p-6 text-left transition-colors hover:border-gray-700"
            >
              <Icon className="mb-4 h-8 w-8 text-brand-500" />
              <h3 className="mb-2 font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-600">
        CloudVault — built with Next.js 14 + Supabase
      </footer>
    </div>
  );
}
