"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { ADVICE_DISCLAIMER, formatAud, type PlanService } from "@/lib/plan-services";
import type { GuideProduct } from "@/lib/guide-products";
import {
  BUDGETS,
  DURATIONS,
  EXPERIENCES,
  PURPOSES,
  STYLES,
  recommend,
  type FinderArticle,
  type TripAnswers,
  type TripResult,
} from "@/lib/trip-finder";

/** Answers stay in this component's memory only: nothing is sent, stored or tracked. */
export default function TripFinder({ articles, services, guides }: { articles: FinderArticle[]; services: PlanService[]; guides: GuideProduct[] }) {
  const [result, setResult] = useState<TripResult | null>(null);
  const [answers, setAnswers] = useState<TripAnswers | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const a = {
      purpose: f.get("purpose"),
      duration: f.get("duration"),
      budget: f.get("budget"),
      style: f.get("style"),
      experience: f.get("experience"),
    } as TripAnswers;
    setAnswers(a);
    setResult(recommend(a, articles));
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  const service = result ? services.find((s) => s.slug === result.serviceSlug) : undefined;
  const guide = result?.guideSlug ? guides.find((g) => g.slug === result.guideSlug) : undefined;

  return (
    <>
      <form className="plan-form finder-form" onSubmit={onSubmit} aria-label="Trip finder">
        <fieldset>
          <legend>What kind of trip is it?</legend>
          <div className="plan-radio-row">
            {PURPOSES.map((p, i) => (
              <label key={p.value} className="plan-radio"><input type="radio" name="purpose" value={p.value} defaultChecked={i === 0} required /><span>{p.label}</span></label>
            ))}
          </div>
        </fieldset>
        <div className="plan-form-grid">
          <label>How long?
            <select name="duration" defaultValue="1–2 weeks" required>{DURATIONS.map((o) => <option key={o}>{o}</option>)}</select>
          </label>
          <label>Budget for the whole trip
            <select name="budget" defaultValue="Not sure yet" required>{BUDGETS.map((o) => <option key={o}>{o}</option>)}</select>
          </label>
          <label>Travel style
            <select name="style" defaultValue="A mix" required>{STYLES.map((o) => <option key={o}>{o}</option>)}</select>
          </label>
        </div>
        <fieldset>
          <legend>Your experience</legend>
          <div className="plan-radio-row">
            {EXPERIENCES.map((x, i) => (
              <label key={x.value} className="plan-radio"><input type="radio" name="experience" value={x.value} defaultChecked={i === 0} required /><span>{x.label}</span></label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="temple-btn">Show my suggestions</button>
        <p className="plan-form-note">Runs in your browser. Your answers are not sent, saved or tracked.</p>
      </form>

      <div ref={resultRef} tabIndex={-1} className="finder-result" aria-live="polite">
        {result && answers && (
          <section aria-labelledby="finder-result-heading">
            <h2 id="finder-result-heading">{result.headline}</h2>
            <ul className="plan-list">{result.advice.map((t) => <li key={t}>{t}</li>)}</ul>

            {result.articles.length > 0 ? (
              <>
                <h3>Articles to read first</h3>
                <ul className="plan-list">
                  {result.articles.map((a) => <li key={a.slug}><Link href={`/articles/${a.slug}`}>{a.title}</Link></li>)}
                </ul>
              </>
            ) : (
              <p className="finder-none">We do not have a published article that closely matches these answers yet. <Link href="/articles">Browse all articles</Link>.</p>
            )}

            {service && (
              <div className="article-service-cta finder-cta">
                <p className="temple-kicker">If you would like help</p>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
                <div className="temple-actions">
                  <TrackedLink event="service_cta_click" href={`/plan-your-trip/${service.slug}`} className="temple-btn">
                    See details · {formatAud(service.priceAud, service.from)}
                  </TrackedLink>
                </div>
                <p className="plan-form-note">Sending an enquiry is not a booking and takes no payment.</p>
              </div>
            )}
            {guide && (
              <p className="article-guide-preview">
                Also in preparation: <Link href={`/guide-shop/${guide.slug}`}>{guide.title}</Link> (preview only, not for sale yet).
              </p>
            )}
            <p className="plan-form-note">{ADVICE_DISCLAIMER}</p>
          </section>
        )}
      </div>
    </>
  );
}
