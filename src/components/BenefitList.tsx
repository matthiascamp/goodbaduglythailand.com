import type { Benefit } from "@/lib/membership-plans";

export default function BenefitList({ items }: { items: Benefit[] }) {
  return (
    <ul>
      {items.map((b) => (
        <li key={b.label} className={b.status === "planned" ? "benefit-planned" : undefined}>
          {b.label}
          {b.status === "planned" && <span className="benefit-tag"> Planned, not yet available</span>}
        </li>
      ))}
    </ul>
  );
}
