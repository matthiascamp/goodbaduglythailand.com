import type { GuideProduct } from "@/lib/guide-products";

/** Original CSS-only cover; decorative, so hidden from assistive tech (the title is rendered beside it). */
export default function GuideCover({ product }: { product: GuideProduct }) {
  return (
    <div className={`guide-cover guide-cover-${product.cover.hue}`} aria-hidden="true">
      <span className="guide-cover-frame">
        <span className="guide-cover-glyph" lang="th">{product.cover.glyph}</span>
        <span className="guide-cover-title">{product.title}</span>
        <span className="guide-cover-flag">Preview</span>
      </span>
    </div>
  );
}
