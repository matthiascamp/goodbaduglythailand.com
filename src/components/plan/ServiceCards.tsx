import Image from "next/image";
import Link from "next/link";
import { formatAud } from "@/lib/plan-services";
import { getResolvedServices } from "@/lib/site-prices";
import { TrackedLink } from "@/components/TrackedLink";

export default async function ServiceCards({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const services = await getResolvedServices();
  return (
    <ul className="plan-cards">
      {services.map((s) => (
        <li key={s.slug}>
          {s.kind === "PAPERWORK" ? <TrackedLink event="paperwork_cta_click" href={`/plan-your-trip/${s.slug}`} className="plan-card plan-card-featured">
            <span className="plan-card-mark" aria-hidden="true"><span>01 / MERV CAN HELP</span><strong>More time<br />in Thailand.</strong></span>
            <span className="plan-card-body">
              <Heading>{s.title}</Heading>
              <span className="plan-card-text">{s.short}</span>
              <span className="plan-card-foot"><strong>{formatAud(s.priceAud, s.from)}</strong><span className="temple-link temple-link-sm">View details</span></span>
            </span>
          </TrackedLink> : <Link href={`/plan-your-trip/${s.slug}`} className="plan-card">
            {s.image ? <span className="plan-card-img">
              <Image src={s.image} alt={s.imageAlt ?? ""} fill sizes="(max-width: 900px) 100vw, 400px" />
            </span> : null}
            <span className="plan-card-body">
              <Heading>{s.title}</Heading>
              <span className="plan-card-text">{s.short}</span>
              <span className="plan-card-foot">
                <strong>{formatAud(s.priceAud, s.from)}</strong>
                <span className="temple-link temple-link-sm">View details</span>
              </span>
            </span>
          </Link>}
        </li>
      ))}
    </ul>
  );
}
