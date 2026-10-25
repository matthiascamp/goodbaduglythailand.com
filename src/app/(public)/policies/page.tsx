import type { Metadata } from "next";
import Link from "next/link";
import { ADVICE_DISCLAIMER, ENQUIRY_NOTICE } from "@/lib/plan-services";
import { POLICY_PENDING_NOTE } from "@/lib/site";

const description = "How membership, planning services and guides work, and the status of refund and cancellation terms (final policy pending owner review).";

export const metadata: Metadata = {
  title: "Policies: refunds, cancellations and terms",
  description,
  alternates: { canonical: "/policies" },
  openGraph: { title: "Policies", description, url: "/policies" },
};

export default function PoliciesPage() {
  return (
    <div className="temple-home">
      <section className="plan-hero">
        <div className="temple-wrap">
          <p className="temple-kicker">Policies</p>
          <h1>Refunds, cancellations <em>and terms</em></h1>
          <p className="temple-lead">What we can say today, and what is still to be decided. {POLICY_PENDING_NOTE} We will not state refund or legal terms here until they are confirmed.</p>
        </div>
      </section>
      <section className="temple-wrap plan-section policy-body">
        <h2>Membership</h2>
        <p>Membership is a one-time lifetime payment, not a subscription, and is available only once checkout is switched on. Access is granted after Stripe confirms the payment. If a payment is fully refunded in Stripe, membership access is removed automatically.</p>
        <p><strong>Refund terms: {POLICY_PENDING_NOTE}</strong> The conditions under which refunds are offered have not been confirmed.</p>

        <h2>Planning services</h2>
        <p>{ENQUIRY_NOTICE} {ADVICE_DISCLAIMER}</p>
        <p><strong>Cancellation, rescheduling and refund terms: {POLICY_PENDING_NOTE}</strong> They will be confirmed in the reply to your enquiry before any payment is requested.</p>

        <h2>Guide shop</h2>
        <p>The guides are previews only. They cannot be bought, and no payment or download exists yet.</p>
        <p><strong>Digital product refund terms: {POLICY_PENDING_NOTE}</strong></p>

        <h2>Affiliate links</h2>
        <p>Some recommendations, when present, are affiliate links. If you book through one we may earn a commission at no extra cost to you. Each is labelled where it appears.</p>

        <h2>Advice</h2>
        <p>Content here is practical personal experience. It is not licensed immigration, legal, financial or medical advice. Rules change; verify anything important with official sources.</p>

        <h2>Consumer rights</h2>
        <p>Nothing on this page limits any rights you have under applicable consumer law. {POLICY_PENDING_NOTE}</p>

        <p><Link href="/privacy">Privacy notice</Link></p>
      </section>
    </div>
  );
}
