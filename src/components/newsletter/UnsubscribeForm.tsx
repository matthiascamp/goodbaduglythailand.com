"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function UnsubscribeForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="newsletter-success" role="status">
        <h3>You have been unsubscribed</h3>
        <p>Your newsletter registration has been stopped. You can register again at any time.</p>
      </div>
    );
  }

  return (
    <form className="newsletter-form" onSubmit={onSubmit} aria-label="Unsubscribe">
      <p>Confirm that you want to stop receiving newsletter emails to the address linked to this link.</p>
      {status === "error" && <p className="plan-error" role="alert">{error}</p>}
      <button className="temple-btn" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Unsubscribing…" : "Confirm unsubscribe"}</button>
    </form>
  );
}
