import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import EnquiryForm from "@/components/plan/EnquiryForm";
import {
  ADVICE_DISCLAIMER,
  EXPERIENCE_STATEMENT,
  PLAN_SERVICES,
  SERVICE_CURRENCY,
  formatAud,
} from "@/lib/plan-services";
import { getResolvedServices } from "@/lib/site-prices";
import { TrackedAnchor } from "@/components/TrackedLink";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return PLAN_SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = (await getResolvedServices()).find((s) => s.slug === slug);
  if (!service) return { title: "Service not found" };
  const path = `/plan-your-trip/${service.slug}`;
  const description = `${service.short} ${formatAud(service.priceAud, service.from)}. Enquire online; no payment is taken yet.`;
  return {
    title: service.title,
    description,
    alternates: { canonical: path },
    openGraph: { title: service.title, description, url: path, ...(service.image ? { images: [service.image] } : {}) },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = (await getResolvedServices()).find((s) => s.slug === slug);
  if (!service) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.short,
    provider: { "@type": "Organization", name: "The Good, Bad & Ugly of Thailand" },
    offers: (service.packages ?? [{ priceAud: service.priceAud }]).map((p) => ({
      "@type": "Offer",
      price: p.priceAud,
      priceCurrency: SERVICE_CURRENCY,
    })),
  };

  return (
    <div className="temple-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="plan-hero plan-hero-detail">
        <div className="temple-wrap plan-detail-head">
          <div>
            <p className="temple-kicker"><Link href="/plan-your-trip">Plan your trip</Link></p>
            <h1>{service.title}</h1>
            <p className="temple-lead">{service.intro}</p>
            <p className="plan-price"><strong>{formatAud(service.priceAud, service.from)}</strong> {service.durationLabel && <span>· {service.durationLabel}</span>}</p>
            {service.kind === "PAPERWORK" ? <TrackedAnchor event="paperwork_cta_click" href="#enquire" className="temple-btn">Ask Merv about your extension</TrackedAnchor> : <a href="#enquire" className="temple-btn">Make an enquiry</a>}
          </div>
          {service.image ? <div className="plan-detail-img">
            <Image src={service.image} alt={service.imageAlt ?? ""} fill sizes="(max-width: 900px) 100vw, 480px" priority />
          </div> : <div className="plan-detail-art" aria-hidden="true"><span>THAILAND / PAPERWORK</span><strong>Stay a<br />little longer.</strong><small>Practical help from Merv</small></div>}
        </div>
      </section>

      <section className="temple-wrap plan-section plan-detail-grid">
        <div>
          {service.packages && (
            <>
              <h2>Packages</h2>
              <ul className="plan-packages">
                {service.packages.map((p) => (
                  <li key={p.id}><div><strong>{p.label}</strong><span>{p.detail}</span></div><b>{formatAud(p.priceAud, p.from)}</b></li>
                ))}
              </ul>
            </>
          )}
          {service.topics.length > 0 && (
            <>
              <h2>What we can talk about</h2>
              <ul className="plan-list">{service.topics.map((t) => <li key={t}>{t}</li>)}</ul>
            </>
          )}
        </div>
        <div>
          <h2>What is included</h2>
          <ul className="plan-list">{service.included.map((t) => <li key={t}>{t}</li>)}</ul>
          <h2>What is not included</h2>
          <ul className="plan-list plan-list-not">{service.notIncluded.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </section>

      {service.kind === "PAPERWORK" && <section className="temple-wrap plan-section paperwork-steps" aria-labelledby="paperwork-steps-heading">
        <p className="temple-kicker">Simple next steps</p>
        <h2 id="paperwork-steps-heading">How the paperwork help works</h2>
        <ol>
          <li><span>01</span><div><h3>Tell Merv the basics</h3><p>Share the type of extension, your current end date and where you are in Thailand. No passport documents are needed in this first enquiry.</p></div></li>
          <li><span>02</span><div><h3>Confirm the scope</h3><p>Merv replies to confirm whether he can help with your case, what paperwork he would prepare and how payment works.</p></div></li>
          <li><span>03</span><div><h3>Review your paperwork</h3><p>Once you agree, Merv prepares the paperwork from your information. You check it before signing and submitting it to Thai immigration.</p></div></li>
        </ol>
        <p>Requirements vary by extension type and can change. Check the current rules with the <a href="https://www.immigration.go.th/" target="_blank" rel="noopener noreferrer">Thai Immigration Bureau</a>.</p>
      </section>}

      <section className="temple-wrap plan-section plan-author" aria-labelledby="plan-author-heading">
        <h2 id="plan-author-heading">Meet Merv</h2>
        <p>{EXPERIENCE_STATEMENT} This is lived, first-hand experience rather than professional accreditation.</p>
        <p>{service.disclaimer ?? ADVICE_DISCLAIMER}</p>
      </section>

      <section className="temple-wrap plan-section plan-enquire" id="enquire" aria-labelledby="enquire-heading">
        <h2 id="enquire-heading">{service.kind === "ITINERARY" ? "Tell us about your trip" : service.kind === "PAPERWORK" ? "Ask Merv about your extension" : "Before we book a time"}</h2>
        <p className="plan-form-lead">{service.kind === "PAPERWORK" ? "Tell Merv the basics so he can confirm whether this service fits your situation. No payment is taken here." : "A few questions help make the most of the conversation. No payment is taken here."}</p>
        <EnquiryForm service={service} />
      </section>
    </div>
  );
}
