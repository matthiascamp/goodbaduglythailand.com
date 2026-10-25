"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutButton({ enabled }: { enabled: boolean }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (session?.user?.role === "ADMIN") {
    return <Link href="/admin" className="editorial-button editorial-button-light">Open admin <span aria-hidden="true">↗</span></Link>;
  }

  if (session?.user?.membershipStatus === "ACTIVE") {
    return <Link href="/dashboard" className="editorial-button editorial-button-light">Open my library <span aria-hidden="true">↗</span></Link>;
  }

  async function beginCheckout() {
    if (!session) {
      router.push("/sign-up?redirect=/membership");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not start.");
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not start.");
      setBusy(false);
    }
  }

  return <>
    <button type="button" className="editorial-button editorial-button-light" onClick={beginCheckout} disabled={!enabled || busy || status === "loading"} aria-disabled={!enabled}>
      {busy ? "Opening checkout…" : enabled ? "Become a member" : "Membership opening soon"}<span aria-hidden="true">↗</span>
    </button>
    {error && <p role="alert" className="membership-checkout-error">{error}</p>}
  </>;
}
