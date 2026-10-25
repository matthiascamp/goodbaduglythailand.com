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
    openGraph: { title: service.title, description, url: path, images: [service.image] },
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
            <a href="#enquire" className="temple-btn">Make an enquiry</a>
          </div>
          <div className="plan-detail-img">
            <Image src={service.image} alt={service.imageAlt} fill sizes="(max-width: 900px) 100vw, 480px" priority />
          </div>
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

      <section className="temple-wrap plan-section plan-author" aria-labelledby="plan-author-heading">
        <h2 id="plan-author-heading">Who you will be speaking with</h2>
        <p>{EXPERIENCE_STATEMENT} This is lived, first-hand experience rather than professional accreditation.</p>
        <p>{service.disclaimer ?? ADVICE_DISCLAIMER}</p>
      </section>

      <section className="temple-wrap plan-section plan-enquire" id="enquire" aria-labelledby="enquire-heading">
        <h2 id="enquire-heading">{service.kind === "ITINERARY" ? "Tell us about your trip" : "Before we book a time"}</h2>
        <p className="plan-form-lead">A few questions help make the most of the conversation. No payment is taken here.</p>
        <EnquiryForm service={service} />
      </section>
    </div>
  );
}
