"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match — classic.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent-500/30 blur-3xl animate-pulse-soft" />
        </div>
        <div className="glass w-full max-w-md rounded-3xl p-10 text-center shadow-soft-lg animate-blur-in">
          <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/30 to-coral-500/30 ring-1 ring-inset ring-white/10">
            <CheckCircle2 className="h-7 w-7 text-accent-200" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">
            Check your email
          </h2>
          <p className="text-sm text-ink-300">
            We sent a confirmation link to{" "}
            <strong className="text-white">{email}</strong>. Click it to
            activate your CloudVault account.
          </p>
          <Link href="/auth/login" className="btn-primary mt-6 inline-flex">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full bg-accent-500/30 blur-3xl animate-pulse-soft" />
        <div className="absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-coral-500/25 blur-3xl animate-pulse-soft [animation-delay:1.4s]" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl aurora-bg shadow-glow-accent">
            <Cloud className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            CloudVault
          </span>
        </Link>

        <div className="glass rounded-3xl p-8 shadow-soft-lg animate-blur-in">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">
            Create your vault
          </h1>
          <p className="mb-8 text-sm text-ink-300">
            Free forever — 1 GB included
          </p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-100">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-100">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-white"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-100">
                Confirm password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-200 animate-slide-down">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-300">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-accent-300 transition-colors hover:text-accent-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
