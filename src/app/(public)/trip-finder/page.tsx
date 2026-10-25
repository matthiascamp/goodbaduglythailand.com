import type { Metadata } from "next";
import TripFinder from "@/components/trip/TripFinder";
import { db } from "@/lib/db";
import { getSitePrices, resolveGuideProducts, resolvePlanServices } from "@/lib/site-prices";

export const dynamic = "force-dynamic";

const description = "Answer five quick questions about your Thailand plans and get practical free advice, relevant articles and, if useful, a planning service.";

export const metadata: Metadata = {
  title: "Trip finder: what kind of Thailand trip are you planning?",
  description,
  alternates: { canonical: "/trip-finder" },
  openGraph: { title: "Thailand trip finder", description, url: "/trip-finder" },
};

export default async function TripFinderPage() {
  const [rows, prices] = await Promise.all([db.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
    select: { slug: true, title: true, excerpt: true, category: { select: { name: true } } },
  }), getSitePrices()]);
  const articles = rows.map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.category?.name ?? null }));

  return (
    <div className="temple-home">
      <section className="plan-hero">
        <div className="temple-wrap">
          <p className="temple-kicker">Trip finder</p>
          <h1>What kind of Thailand trip <em>are you planning?</em></h1>
          <p className="temple-lead">Five questions, simple rules, no sign-up. You get practical suggestions and links to articles we have actually published.</p>
        </div>
      </section>
      <section className="temple-wrap plan-section">
        <TripFinder articles={articles} services={resolvePlanServices(prices)} guides={resolveGuideProducts(prices)} />
      </section>
    </div>
  );
}
