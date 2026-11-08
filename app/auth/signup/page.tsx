"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "@/lib/useLoading";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setGlobalLoading(true);
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
      setGlobalLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setGlobalLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm animate-slide-up border-t-[1.5px] border-ink-50 pt-8 text-center">
          <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10">
            <CheckCircle2 className="h-6 w-6 text-accent-400" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-3xl font-semibold tracking-tight text-ink-50">
            Check your email
          </h2>
          <p className="text-sm text-ink-300">
            We sent a confirmation link to{" "}
            <strong className="text-ink-50">{email}</strong>. Click it to
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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-slide-up">
        <Link
          href="/"
          className="mb-10 block text-center font-serif text-2xl font-semibold italic tracking-tight text-ink-50"
        >
          CloudVault
        </Link>

        <div className="border-t-[1.5px] border-ink-50 pt-8">
          <h1 className="mb-1 text-3xl font-semibold tracking-tight text-ink-50">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-50"
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
              <div className="rounded-[10px] border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-200 animate-slide-down">
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
              className="font-medium text-accent-400 underline-offset-4 transition-colors hover:text-accent-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
