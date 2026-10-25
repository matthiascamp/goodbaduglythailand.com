import type { Metadata } from "next";
import Link from "next/link";
import ServiceCards from "@/components/plan/ServiceCards";
import { ADVICE_DISCLAIMER, ENQUIRY_NOTICE, EXPERIENCE_STATEMENT } from "@/lib/plan-services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plan Your Trip",
  description:
    "Work with Merv, who lived in Thailand for 18 years. Extension paperwork preparation, insider consultations, itineraries and moving guidance, priced in AUD.",
  alternates: { canonical: "/plan-your-trip" },
  openGraph: { title: "Plan Your Trip · The Good, Bad & Ugly of Thailand", description: "Insider consultations and custom itineraries for Thailand.", url: "/plan-your-trip" },
};

export default function PlanYourTripPage() {
  return (
    <div className="temple-home">
      <section className="plan-hero">
        <div className="temple-wrap">
          <p className="temple-kicker"><span className="temple-kicker-line" />Plan your trip</p>
          <h1>Get Merv <em>in your corner.</em></h1>
          <p className="temple-lead">{EXPERIENCE_STATEMENT} Get help with extension paperwork, a move, or the trip you have been planning. Every service starts with an enquiry, so you can ask before you commit.</p>
        </div>
      </section>

      <section className="temple-wrap plan-section" aria-labelledby="plan-services-heading">
        <h2 id="plan-services-heading" className="sr-only">Services</h2>
        <ServiceCards headingLevel="h2" />
      </section>

      <section className="temple-wrap plan-section plan-notes" aria-labelledby="plan-notes-heading">
        <h2 id="plan-notes-heading">How it works</h2>
        <ol>
          <li>Pick a service and send an enquiry with a few details.</li>
          <li>You get a direct reply to confirm scope, scheduling and payment details.</li>
          <li>Nothing is booked, and nothing is charged, until you both agree.</li>
        </ol>
        <p>{ENQUIRY_NOTICE}</p>
        <p>{ADVICE_DISCLAIMER}</p>
        <p>Not sure what you need? Try the free <Link href="/trip-finder" className="temple-link temple-link-sm">trip finder</Link>. Looking for something different? See <Link href="/services" className="temple-link temple-link-sm">other advice options</Link>.</p>
      </section>
    </div>
  );
}
