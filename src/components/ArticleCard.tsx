import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface ArticleCardProps {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date | string | null;
  category?: { name: string; slug: string } | null;
}

export default function ArticleCard({
  title,
  slug,
  excerpt,
  publishedAt,
  category,
}: ArticleCardProps) {
  return (
    <article className="bg-cream rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group border border-gold/20">
      {/* Decorative header bar */}
      <div className="h-1.5 bg-gold-gradient" />

      <div className="p-6">
        {/* Category */}
        {category && (
          <Link
            href={`/articles?category=${category.slug}`}
            className="inline-block text-xs font-semibold text-emerald uppercase tracking-wider mb-3 hover:text-emerald-light transition-colors"
          >
            {category.name}
          </Link>
        )}

        {/* Title */}
        <h2 className="font-serif text-xl font-bold text-charcoal mb-3 group-hover:text-burgundy transition-colors leading-snug">
          <Link href={`/articles/${slug}`}>{title}</Link>
        </h2>

        {/* Excerpt */}
        <p className="text-charcoal/70 text-sm leading-relaxed mb-4 line-clamp-3">
          {excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gold/20">
          <time className="text-charcoal/50 text-xs">
            {formatDate(publishedAt)}
          </time>
          <Link
            href={`/articles/${slug}`}
            className="text-gold hover:text-gold-dark text-sm font-semibold transition-colors"
          >
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}
