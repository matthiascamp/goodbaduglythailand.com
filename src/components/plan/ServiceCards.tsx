import Image from "next/image";
import Link from "next/link";
import { formatAud } from "@/lib/plan-services";
import { getResolvedServices } from "@/lib/site-prices";

export default async function ServiceCards({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const services = await getResolvedServices();
  return (
    <ul className="plan-cards">
      {services.map((s) => (
        <li key={s.slug}>
          <Link href={`/plan-your-trip/${s.slug}`} className="plan-card">
            <span className="plan-card-img">
              <Image src={s.image} alt={s.imageAlt} fill sizes="(max-width: 900px) 100vw, 400px" />
            </span>
            <span className="plan-card-body">
              <Heading>{s.title}</Heading>
              <span className="plan-card-text">{s.short}</span>
              <span className="plan-card-foot">
                <strong>{formatAud(s.priceAud, s.from)}</strong>
                <span className="temple-link temple-link-sm">View details</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
