import type { Metadata } from "next";
import Link from "next/link";
import CheckoutButton from "./CheckoutButton";
import { getPricingConfig } from "@/lib/pricing";
import BenefitList from "@/components/BenefitList";
import { MEMBER_BENEFITS, VISITOR_BENEFITS } from "@/lib/membership-plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membership",
  description: "One payment opens the full Good, Bad & Ugly Thailand course library.",
};

const steps = [
  { number: "01", title: "Create your account", text: "Your account keeps your courses and lesson progress in one place." },
  { number: "02", title: "Pay once", text: "Membership is a single purchase. There is no recurring subscription." },
  { number: "03", title: "Explore the library", text: "After payment is confirmed, all published courses become available in your member area." },
];

const faqs = [
  { question: "Is this a subscription?", answer: "No. Membership is purchased once and does not renew automatically." },
  { question: "What does membership unlock?", answer: "All published courses and member resources in the library. You can return to lessons and track your progress from your account." },
  { question: "Can I read anything before joining?", answer: "Yes. The journal is public, so you can explore the editorial approach before purchasing." },
  { question: "When will I get access?", answer: "Access is granted after the payment provider confirms your purchase. You can then sign in and open the member library." },
];

export default async function MembershipPage() {
  const pricing = await getPricingConfig();
  const ready = pricing.configured;
  const price = pricing.displayPrice ?? null;

  return (
    <>
      <section className="membership-hero">
        <div className="editorial-container membership-hero-grid">
          <div>
            <p className="editorial-eyebrow"><span className="editorial-rule" /> MEMBERSHIP / ONE PAYMENT</p>
            <h1>All of Thailand.<br /><em>One library.</em></h1>
          </div>
          <div className="membership-hero-aside">
            <span>THE IDEA</span>
            <p>A clear path through the good, the bad and the ugly. One membership gives you access to every published course and lesson in the library.</p>
            <Link href="/articles" className="editorial-text-link">Explore free articles <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="membership-feature">
        <div className="editorial-container membership-feature-grid">
          <div className="membership-feature-image" role="img" aria-label="Conceptual image of a Thailand field guide and tea beside a Bangkok street" />
          <div className="membership-feature-copy">
            <p className="editorial-eyebrow editorial-eyebrow-light"><span className="editorial-rule" /> WHAT YOU GET</p>
            <h2>Learn at your own pace. <em>Keep coming back.</em></h2>
            <p>Your member area brings courses, lessons, downloadable resources and progress together. Browse the library on desktop or mobile, and continue where you left off.</p>
            <ul>
              <li><span>01</span>Access to every published course</li>
              <li><span>02</span>Lessons and downloadable resources in one place</li>
              <li><span>03</span>Progress saved to your account</li>
              <li><span>04</span>One payment, with no automatic renewal</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="membership-process" aria-labelledby="compare-heading">
        <div className="editorial-container">
          <p className="editorial-eyebrow"><span className="editorial-rule" /> VISITOR AND MEMBER</p>
          <h2 id="compare-heading" className="editorial-display">What each <em>includes.</em></h2>
          <div className="temple-plans">
            <div className="temple-plan">
              <span className="temple-plan-label">Visitor</span>
              <span className="temple-plan-price">Free</span>
              <hr />
              <BenefitList items={VISITOR_BENEFITS} />
            </div>
            <div className="temple-plan temple-plan-member">
              <span className="temple-plan-label temple-gold">Member</span>
              <span className="temple-plan-price">{price ?? "One payment"}{price && <small> / once{!ready ? " · planned" : ""}</small>}</span>
              <hr />
              <BenefitList items={MEMBER_BENEFITS} />
            </div>
          </div>
          <p className="benefit-footnote">Membership is a one-time lifetime purchase today. Items marked “Planned” are not available yet and are not part of what you receive at checkout. Membership does not include consultations; those are booked separately.</p>
        </div>
      </section>

      <section className="membership-process">
        <div className="editorial-container">
          <p className="editorial-eyebrow"><span className="editorial-rule" /> HOW IT WORKS</p>
          <h2 className="editorial-display">A simple way <em>in.</em></h2>
          <div className="membership-steps">
            {steps.map((step) => <div key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="membership-purchase">
        <div className="editorial-container membership-purchase-grid">
          <div>
            <p className="editorial-eyebrow editorial-eyebrow-light"><span className="editorial-rule" /> THE LIBRARY IS YOURS</p>
            <h2>Ready for the <em>whole story?</em></h2>
          </div>
          <div className="membership-purchase-action">
            <span>ONE-TIME MEMBERSHIP</span>
            <strong>{price ? `${ready ? "" : "Planned: "}${price}` : "Price to be confirmed"}</strong>
            <p>{ready ? "One payment. No recurring charge." : "Purchasing opens when the course library, price and payment details are confirmed."}</p>
            <CheckoutButton enabled={ready} />
            <small>Payments are handled by Stripe when checkout is enabled. See the <Link href="/policies">refund policy</Link> (final policy pending owner review) and <Link href="/privacy">privacy notice</Link>.</small>
          </div>
        </div>
      </section>

      <section className="membership-faq">
        <div className="editorial-container membership-faq-grid">
          <div><p className="editorial-eyebrow"><span className="editorial-rule" /> QUESTIONS</p><h2 className="editorial-display">The details,<br /><em>plainly.</em></h2></div>
          <div>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div>
        </div>
      </section>
    </>
  );
}
