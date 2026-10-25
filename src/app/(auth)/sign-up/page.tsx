"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email.toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Registration failed");
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
        router.push("/sign-in");
        return;
      }

      router.push("/membership");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
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
          <span className="auth-eyebrow">YOUR ACCOUNT / 01</span>
          <h1 className="font-serif text-2xl font-bold text-charcoal mb-2 text-center">
            Begin here.
          </h1>
          <p className="text-charcoal/50 text-sm text-center mb-6">
            Create a free account. Membership will be available when the library opens.
          </p>

          {error && (
            <div className="bg-burgundy/10 border border-burgundy/30 text-burgundy rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-charcoal mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-cream"
              />
            </div>

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
                autoComplete="email"
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
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-cream"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-charcoal font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-charcoal/60">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-gold hover:text-gold-dark font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
