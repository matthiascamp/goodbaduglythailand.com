"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { NEWSLETTER_CONSENT_TEXT, NEWSLETTER_PRIVACY_NOTE, NEWSLETTER_STATUS_NOTE } from "@/lib/newsletter-schema";

type Status = "idle" | "submitting" | "success" | "error";

interface Props {
  /** Recorded with the consent, e.g. "home", "footer", "article:slug". */
  source: string;
  heading?: string;
  intro?: string;
  compact?: boolean;
  buttonLabel?: string;
}

export default function NewsletterSignup({ source, heading, intro, compact = false, buttonLabel = "Register my interest" }: Props) {
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    const form = new FormData(e.currentTarget);
    setStatus("submitting");
    setError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          consent: form.get("consent") === "on",
          source,
          website: String(form.get("website") ?? ""),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string>; emailSent?: boolean };
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setEmailSent(!!data.emailSent);
      setStatus("success");
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  const headingId = `${uid}-h`;
  if (status === "success") {
    return (
      <div className={`newsletter${compact ? " newsletter-compact" : ""}`}>
        <div className="newsletter-success" role="status">
          <h3>Interest registered</h3>
          <p>
            Thank you. Your email and consent have been saved.{" "}
            {emailSent ? "A confirmation email has been sent." : "No email has been sent yet: the checklist and email delivery are still in preparation."}{" "}
            {emailSent ? "That email includes your personal unsubscribe link." : "If we email you later, each message will include a personal unsubscribe link."}
          </p>
        </div>
      </div>
    );
  }

  const fieldErr = (k: string) => fieldErrors[k] && <span className="plan-field-error" id={`${uid}-err-${k}`}>{fieldErrors[k]}</span>;
  const aria = (k: string) => ({ "aria-invalid": fieldErrors[k] ? true : undefined, "aria-describedby": fieldErrors[k] ? `${uid}-err-${k}` : undefined });

  return (
    <div className={`newsletter${compact ? " newsletter-compact" : ""}`}>
      {heading && <h3 id={headingId}>{heading}</h3>}
      {intro && <p className="newsletter-intro">{intro}</p>}
      <form className="newsletter-form" onSubmit={onSubmit} noValidate aria-labelledby={heading ? headingId : undefined} aria-label={heading ? undefined : "Newsletter sign-up"}>
        <label>
          <span className="newsletter-label">Email address</span>
          <input name="email" type="email" autoComplete="email" required maxLength={200} {...aria("email")} />
        </label>
        {fieldErr("email")}
        <div className="plan-hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="newsletter-consent">
          <input type="checkbox" name="consent" required {...aria("consent")} />
          <span>{NEWSLETTER_CONSENT_TEXT}</span>
        </label>
        {fieldErr("consent")}
        {status === "error" && !Object.keys(fieldErrors).length && <p className="plan-error" role="alert">{error}</p>}
        <button className="temple-btn" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Saving…" : buttonLabel}</button>
        {compact ? (
          <p className="newsletter-note">Checklist and emails are in preparation. <Link href="/newsletter">Details</Link> · <Link href="/privacy">Privacy</Link></p>
        ) : (
          <>
            <p className="newsletter-note">{NEWSLETTER_STATUS_NOTE}</p>
            <p className="newsletter-note">{NEWSLETTER_PRIVACY_NOTE} See the <Link href="/privacy">privacy notice</Link>.</p>
          </>
        )}
      </form>
    </div>
  );
}
