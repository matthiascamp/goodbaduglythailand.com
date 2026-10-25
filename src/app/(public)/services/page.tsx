import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Advice",
  description: "Explore one-to-one advice options, including format, duration and price.",
};

export default async function ServicesPage() {
  const services = await db.service.findMany({ where: { available: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return <>
    <section className="inner-hero inner-hero-services"><div className="editorial-container"><p className="editorial-eyebrow editorial-eyebrow-light"><span className="editorial-rule" /> PERSONAL ADVICE</p><h1>When the question<br />is <em>yours alone.</em></h1><p>Course materials cover the wider picture. Individual advice can help with questions that need a more personal conversation.</p></div></section>
    <section className="inner-list-section"><div className="editorial-container"><div className="inner-list-heading"><p className="editorial-eyebrow"><span className="editorial-rule" /> AVAILABLE SERVICES</p><h2>Talk it <em>through.</em></h2></div>
      {services.length ? <><div className="inner-service-list">{services.map((service, index) => <div className="inner-service-row" key={service.id}><span>{String(index + 1).padStart(2,"0")}</span><div><h3>{service.title}</h3><p>{service.description}</p>{service.details && <p className="inner-service-details">{service.details}</p>}</div><div className="inner-service-facts"><strong>{formatPrice(service.priceCents, service.currency, "en-AU")} <small>{service.currency.toUpperCase()}</small></strong><span>{service.durationMin ? `${service.durationMin} minute call` : "Duration on request"}</span></div></div>)}</div><p className="inner-service-booking-note">Online booking and payment are being prepared. Looking for a trip consultation or itinerary? See <Link href="/plan-your-trip">Plan Your Trip</Link>.</p></> : <div className="inner-empty"><span>01 / IN PREPARATION</span><h3>Advice options are being finalised.</h3><p>Formats, availability and prices will be shown here once confirmed.</p></div>}
    </div></section>
    <section className="inner-cta"><div className="editorial-container"><h2>Prefer to explore<br /><em>at your own pace?</em></h2><Link href="/membership" className="editorial-button editorial-button-light">See membership <span aria-hidden="true">↗</span></Link></div></section>
  </>;
}
