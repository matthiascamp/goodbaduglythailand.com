import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Journal",
  description: "Articles and perspectives from Good, Bad & Ugly Thailand.",
};

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [categories, articles] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.article.findMany({ where: { published: true, ...(category ? { category: { slug: category } } : {}) }, orderBy: { publishedAt: "desc" }, include: { category: true } }),
  ]);
  return <>
    <section className="inner-hero inner-hero-journal"><div className="editorial-container"><p className="editorial-eyebrow editorial-eyebrow-light"><span className="editorial-rule" /> THE JOURNAL</p><h1>Field notes for<br /><em>clearer thinking.</em></h1><p>Questions, observations and practical guides for looking beyond the postcard.</p></div></section>
    <section className="inner-list-section"><div className="editorial-container">
      <div className="inner-filters"><Link href="/articles" className={!category ? "active" : ""}>All topics</Link>{categories.map((item) => <Link key={item.id} href={`/articles?category=${item.slug}`} className={category === item.slug ? "active" : ""}>{item.name}</Link>)}</div>
      {articles.length ? <div className="editorial-article-list">{articles.map((article,index) => <Link className="editorial-article-row" href={`/articles/${article.slug}`} key={article.id}><span className="editorial-index">{String(index+1).padStart(2,"0")}</span><div><span className="editorial-small-label">{article.category?.name ?? "ARTICLE"}</span><h2>{article.title}</h2><p>{article.excerpt}</p></div><span className="editorial-article-arrow" aria-hidden="true">↗</span></Link>)}</div> : <div className="inner-empty"><span>01 / IN PREPARATION</span><h2>The first stories are on their way.</h2><p>Reviewed articles will appear here when published.</p></div>}
    </div></section>
  </>;
}
