import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import CommentForm from "@/components/CommentForm";
import Image from "next/image";
import ArticleBody from "@/components/ArticleBody";
import ArticleServiceCta from "@/components/plan/ArticleServiceCta";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
import AffiliateRecommendation from "@/components/AffiliateRecommendation";
import { getArticleAffiliates } from "@/lib/affiliates";
import AuthorNote from "@/components/AuthorNote";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Next.js 16: params is a Promise
interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true, coverImage: true, publishedAt: true, updatedAt: true },
  });

  if (!article) return { title: "Article Not Found", robots: { index: false, follow: false } };

  const path = `/articles/${slug}`;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: path,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      ...(article.coverImage ? { images: [article.coverImage] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  const article = await db.article.findUnique({
    where: { slug, published: true },
    include: {
      category: true,
      comments: {
        where: { approved: true },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!article) notFound();

  const url = `${SITE_URL}/articles/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    mainEntityOfPage: url,
    url,
    ...(article.publishedAt ? { datePublished: article.publishedAt.toISOString() } : {}),
    dateModified: article.updatedAt.toISOString(),
    ...(article.coverImage ? { image: article.coverImage.startsWith("http") ? article.coverImage : `${SITE_URL}${article.coverImage}` } : {}),
    // No individual author name has been supplied, so the site is credited rather than an invented person.
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(article.category ? { articleSection: article.category.name } : {}),
  };

  return (
    <article className="article-page max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="flex items-center gap-2 text-sm text-charcoal/50 mb-8">
        <Link href="/articles" className="hover:text-gold transition-colors">Articles</Link>
        {article.category && (
          <>
            <span>/</span>
            <Link
              href={`/articles?category=${article.category.slug}`}
              className="hover:text-gold transition-colors"
            >
              {article.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="truncate max-w-[200px]">{article.title}</span>
      </nav>

      {article.coverImage && <Image unoptimized src={article.coverImage} alt="" width={1200} height={600} className="article-cover" />}
      <header className="mb-10">
        {article.category && (
          <Link
            href={`/articles?category=${article.category.slug}`}
            className="inline-block text-xs font-semibold text-emerald uppercase tracking-wider mb-4 hover:text-emerald-light transition-colors"
          >
            {article.category.name}
          </Link>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight mb-6">
          {article.title}
        </h1>
        <p className="text-charcoal/60 text-xl leading-relaxed mb-6">{article.excerpt}</p>
        <div className="flex items-center gap-4 text-sm text-charcoal/50 border-t border-gold/20 pt-6">
          <time>{formatDate(article.publishedAt)}</time>
          <span>·</span>
          <span>{article.comments.length} comments</span>
        </div>
      </header>

      <div className="flex items-center gap-4 mb-10">
        <div className="flex-1 h-px bg-gold/20" />
        <span className="text-gold">✦</span>
        <div className="flex-1 h-px bg-gold/20" />
      </div>

      <div className="prose-thai mb-16"><ArticleBody content={article.content} /></div>

      {getArticleAffiliates(article.slug).map((item) => <AffiliateRecommendation key={item.url} item={item} />)}
      <AuthorNote />
      <ArticleServiceCta article={{ title: article.title, excerpt: article.excerpt, category: article.category?.name }} />
      <aside className="article-newsletter" aria-label="Newsletter">
        <NewsletterSignup source={`article:${article.slug}`} compact heading="Get the free Thailand checklist when it is ready" intro="The checklist is in preparation. Register your interest to be told when it is available." />
      </aside>

      <div className="flex items-center gap-4 mb-12">
        <div className="flex-1 h-px bg-gold/20" />
        <span className="text-gold">✦</span>
        <div className="flex-1 h-px bg-gold/20" />
      </div>

      <section>
        <h2 className="font-serif text-2xl font-bold text-charcoal mb-8">
          Comments ({article.comments.length})
        </h2>

        {article.comments.length > 0 && (
          <div className="space-y-6 mb-10">
            {article.comments.map((comment) => (
              <div key={comment.id} className="bg-cream-dark rounded-xl p-5 border border-gold/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                    {(comment.user?.name ?? "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-charcoal">
                      {comment.user?.name ?? "Anonymous"}
                    </span>
                    <span className="text-charcoal/40 text-xs ml-2">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-charcoal/70 text-sm leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-cream border border-gold/20 rounded-xl p-6">
          <h3 className="font-serif text-xl font-semibold text-charcoal mb-4">Leave a Comment</h3>
          <CommentForm articleId={article.id} />
        </div>
      </section>
    </article>
  );
}
