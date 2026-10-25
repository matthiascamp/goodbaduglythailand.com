"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminMode = searchParams.get("admin") === "1";
  const requestedRedirect = searchParams.get("redirect");
  const redirect = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
    ? requestedRedirect
    : adminMode ? "/admin" : "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorParam === "CredentialsSignin" ? "Invalid login or password." : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid login or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="auth-screen min-h-screen bg-cream-dark flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-gold text-3xl">✦</span>
            <span className="font-serif font-bold text-charcoal text-xl">
              Good, Bad & Ugly Thailand
            </span>
          </Link>
        </div>

        <div className="auth-card bg-cream rounded-2xl shadow-lg border border-gold/20 p-8">
          <span className="auth-eyebrow">{adminMode ? "CONTENT STUDIO / OWNER" : "ACCOUNT ACCESS / 01"}</span>
          <h1 className="font-serif text-2xl font-bold text-charcoal mb-2 text-center">
            {adminMode ? "Welcome to the studio." : "Welcome back."}
          </h1>
          <p className="text-charcoal/50 text-sm text-center mb-6">
            {adminMode ? "Sign in to publish articles and manage the site." : "Access your member library or content studio."}
          </p>

          {error && (
            <div className="bg-burgundy/10 border border-burgundy/30 text-burgundy rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-charcoal mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-cream"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-charcoal mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-cream"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-charcoal font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {!adminMode && (
            <>
              <div className="mt-6 text-center text-sm text-charcoal/60">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="text-gold hover:text-gold-dark font-semibold">Sign up</Link>
              </div>
              <div className="mt-4 text-center">
                <Link href="/membership" className="text-xs text-charcoal/40 hover:text-gold transition-colors">Explore membership →</Link>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
