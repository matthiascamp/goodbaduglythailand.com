import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { PLAN_SERVICES } from "@/lib/plan-services";
import { GUIDE_PRODUCTS } from "@/lib/guide-products";

export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://goodbadanduglythailand.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/articles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/membership`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/plan-your-trip`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    ...PLAN_SERVICES.map((s) => ({ url: `${BASE_URL}/plan-your-trip/${s.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${BASE_URL}/newsletter`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/guide-shop`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...GUIDE_PRODUCTS.map((g) => ({ url: `${BASE_URL}/guide-shop/${g.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/trip-finder`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/policies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  // Dynamic article pages
  const articles = await db.article.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/articles/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes];
}
