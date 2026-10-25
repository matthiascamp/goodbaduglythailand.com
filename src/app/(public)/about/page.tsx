import type { Metadata } from "next";
import Link from "next/link";
import { EXPERIENCE_STATEMENT, ADVICE_DISCLAIMER } from "@/lib/plan-services";

export const metadata: Metadata = {
  title: "About",
  description: "The thinking behind Good, Bad & Ugly Thailand: a clearer, more complete way to learn about the country, written from approximately 18 years of lived experience.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <>
    <section className="inner-hero inner-hero-about">
      <div className="editorial-container">
        <p className="editorial-eyebrow editorial-eyebrow-light"><span className="editorial-rule" /> ABOUT THE PROJECT</p>
        <h1>The whole picture<br /><em>matters.</em></h1>
        <p>Good, Bad & Ugly Thailand is being built as a place for candid, practical learning about Thailand.</p>
      </div>
    </section>
    <section className="inner-story">
      <div className="editorial-container inner-story-grid">
        <p className="editorial-eyebrow"><span className="editorial-rule" /> OUR APPROACH</p>
        <div>
          <h2>Curiosity without <em>rose-coloured glasses.</em></h2>
          <p>Thailand is complex. A useful guide should make room for what is rewarding, what takes adjustment, and what deserves a closer look. This platform brings those perspectives together through articles and a structured course library.</p>
          <p>Our aim is to help you ask better questions before big decisions, notice the details that shape everyday life, and make room for more than one version of Thailand.</p>
        </div>
      </div>
    </section>
    <section className="inner-story" id="author" aria-labelledby="author-heading">
      <div className="editorial-container inner-story-grid">
        <p className="editorial-eyebrow"><span className="editorial-rule" /> ABOUT THE AUTHOR</p>
        <div>
          <h2 id="author-heading">Lived experience, <em>not a brochure.</em></h2>
          <p>{EXPERIENCE_STATEMENT} The articles and advice here come from day-to-day life in the country, including the parts that are frustrating or expensive, not from a tourism board.</p>
          <p>{ADVICE_DISCLAIMER} Where a detail depends on rules that change, such as visas, we say so and point to official sources.</p>
          <p>A fuller biography will be added once the owner has approved it. Planning help is available on <Link href="/plan-your-trip">Plan Your Trip</Link>, and the free <Link href="/trip-finder">trip finder</Link> gives quick suggestions. See also the <Link href="/privacy">privacy notice</Link> and <Link href="/policies">policies</Link>.</p>
        </div>
      </div>
    </section>
    <section className="inner-principles">
      <div className="editorial-container">
        <p className="editorial-eyebrow editorial-eyebrow-light"><span className="editorial-rule" /> WHAT GUIDES THE WORK</p>
        <div className="inner-principle-grid">
          <div><span>01</span><h3>Clarity</h3><p>Explain practical decisions in plain language, with context and dates when details can change.</p></div>
          <div><span>02</span><h3>Nuance</h3><p>Look beyond simple “best” and “worst” lists. Different circumstances call for different answers.</p></div>
          <div><span>03</span><h3>Honesty</h3><p>Separate lived perspective from facts that need independent checking.</p></div>
        </div>
      </div>
    </section>
    <section className="inner-cta"><div className="editorial-container"><h2>Start with the <em>journal.</em></h2><Link href="/articles" className="editorial-button editorial-button-light">Explore articles <span aria-hidden="true">↗</span></Link></div></section>
  </>;
}
