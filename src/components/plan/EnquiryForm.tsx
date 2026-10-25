"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ACTIVITY_OPTIONS, BUDGET_OPTIONS, TRAVEL_STYLES } from "@/lib/enquiry-schema";
import { ENQUIRY_NOTICE, formatAud, type PlanService } from "@/lib/plan-services";

type Status = "idle" | "submitting" | "success" | "error";

export default function EnquiryForm({ service }: { service: PlanService }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isItinerary = service.kind === "ITINERARY";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "");

    const common = {
      kind: service.kind,
      serviceSlug: service.slug,
      name: get("name"),
      email: get("email"),
      message: get("message"),
      website: get("website"),
      acknowledged: form.get("acknowledged") === "on" ? true : false,
    };
    const payload = service.kind === "PAPERWORK"
      ? {
          ...common,
          extensionType: get("extensionType"),
          expiryDate: get("expiryDate"),
          location: get("location"),
        }
      : isItinerary
      ? {
          ...common,
          packageId: get("packageId"),
          travelDates: get("travelDates"),
          travellers: get("travellers"),
          budget: get("budget"),
          destinations: get("destinations"),
          activities: form.getAll("activities").map(String),
          travelStyle: get("travelStyle"),
          accommodation: get("accommodation"),
          requirements: get("requirements"),
        }
      : {
          ...common,
          firstVisit: get("firstVisit"),
          timeframe: get("timeframe"),
          topics: get("topics"),
          timezone: get("timezone"),
        };

    setStatus("submitting");
    setError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
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
      <div className="plan-success" role="status">
        <h3>Enquiry received</h3>
        <p>Thank you. Your enquiry has been saved. This is not a confirmed booking and no payment has been taken. You will receive a direct reply by email with next steps.</p>
      </div>
    );
  }

  const err = (k: string) => fieldErrors[k] && <span className="plan-field-error" id={`err-${k}`}>{fieldErrors[k]}</span>;
  const aria = (k: string) => ({ "aria-invalid": fieldErrors[k] ? true : undefined, "aria-describedby": fieldErrors[k] ? `err-${k}` : undefined });

  return (
    <form className="plan-form" onSubmit={onSubmit} noValidate aria-label={`${service.title} enquiry`}>
      <div className="plan-form-grid">
        <label>Your name<input name="name" autoComplete="name" required maxLength={100} {...aria("name")} />{err("name")}</label>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={200} {...aria("email")} />{err("email")}</label>
      </div>

      {service.kind === "PAPERWORK" ? (
        <>
          <label>What kind of extension do you need?<input name="extensionType" required maxLength={200} placeholder="If you are unsure, say so" {...aria("extensionType")} />{err("extensionType")}</label>
          <div className="plan-form-grid">
            <label>When does your current permission to stay end?<input name="expiryDate" required maxLength={100} placeholder="Date or approximate date" {...aria("expiryDate")} />{err("expiryDate")}</label>
            <label>Where in Thailand are you?<input name="location" required maxLength={200} placeholder="City or province" {...aria("location")} />{err("location")}</label>
          </div>
          <p className="plan-form-note">Please do not send passport numbers or copies through this enquiry form. Merv will confirm the scope and next steps by email.</p>
        </>
      ) : isItinerary ? (
        <>
          <fieldset>
            <legend>Package</legend>
            <div className="plan-radio-row">
              {service.packages?.map((p, i) => (
                <label key={p.id} className="plan-radio">
                  <input type="radio" name="packageId" value={p.id} defaultChecked={i === 0} />
                  <span>{p.label} <strong>{formatAud(p.priceAud, p.from)}</strong></span>
                </label>
              ))}
            </div>
            {err("packageId")}
          </fieldset>
          <div className="plan-form-grid">
            <label>Travel dates or approximate month<input name="travelDates" required maxLength={200} {...aria("travelDates")} />{err("travelDates")}</label>
            <label>Number of travellers<input name="travellers" type="number" min={1} max={30} defaultValue={2} required {...aria("travellers")} />{err("travellers")}</label>
            <label>Approximate total budget (AUD)
              <select name="budget" defaultValue="" required {...aria("budget")}>
                <option value="" disabled>Choose…</option>
                {BUDGET_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>{err("budget")}
            </label>
            <label>Travel style
              <select name="travelStyle" defaultValue="" required {...aria("travelStyle")}>
                <option value="" disabled>Choose…</option>
                {TRAVEL_STYLES.map((o) => <option key={o}>{o}</option>)}
              </select>{err("travelStyle")}
            </label>
          </div>
          <label>Destinations of interest<input name="destinations" required maxLength={500} placeholder="e.g. Bangkok, Chiang Mai, or “open to suggestions”" {...aria("destinations")} />{err("destinations")}</label>
          <fieldset>
            <legend>Preferred activities</legend>
            <div className="plan-check-row">
              {ACTIVITY_OPTIONS.map((a) => <label key={a} className="plan-radio"><input type="checkbox" name="activities" value={a} /><span>{a}</span></label>)}
            </div>
          </fieldset>
          <label>Accommodation preferences<input name="accommodation" maxLength={500} /></label>
          <label>Additional requirements<textarea name="requirements" rows={4} maxLength={1500} placeholder="Mobility, dietary needs, children, must-sees…" /></label>
        </>
      ) : (
        <>
          <fieldset>
            <legend>Have you been to Thailand before?</legend>
            <div className="plan-radio-row">
              <label className="plan-radio"><input type="radio" name="firstVisit" value="yes" /><span>This would be my first visit</span></label>
              <label className="plan-radio"><input type="radio" name="firstVisit" value="no" /><span>I have been before</span></label>
              <label className="plan-radio"><input type="radio" name="firstVisit" value="undecided" /><span>Still deciding</span></label>
            </div>
            {err("firstVisit")}
          </fieldset>
          <label>{service.slug.startsWith("moving") ? "Roughly when are you thinking of moving?" : "Roughly when are you travelling?"}<input name="timeframe" required maxLength={200} {...aria("timeframe")} />{err("timeframe")}</label>
          <label>The questions you most want answered<textarea name="topics" rows={5} required maxLength={1500} {...aria("topics")} />{err("topics")}</label>
          <label>Your time zone (for scheduling)<input name="timezone" maxLength={100} placeholder="e.g. Brisbane (AEST)" /></label>
        </>
      )}

      <label>Anything else we should know? (optional)<textarea name="message" rows={3} maxLength={2000} /></label>

      {/* Honeypot — hidden from people and assistive tech */}
      <div className="plan-hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <label className="plan-ack">
        <input type="checkbox" name="acknowledged" required {...aria("acknowledged")} />
        <span>{ENQUIRY_NOTICE}{service.disclaimer ? ` ${service.disclaimer}` : ""}</span>
      </label>
      {err("acknowledged")}

      {status === "error" && <p className="plan-error" role="alert">{error}</p>}
      <button className="temple-btn" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : "Send enquiry"}</button>
      <p className="plan-form-note">We use your details only to reply to this enquiry. See the <Link href="/privacy">privacy notice</Link> and <Link href="/policies">refund and cancellation policy</Link> (final policy pending owner review).</p>
    </form>
  );
}
