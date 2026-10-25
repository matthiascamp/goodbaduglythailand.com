import type { Metadata } from "next";
import Link from "next/link";
import { POLICY_PENDING_NOTE, SITE_NAME } from "@/lib/site";

const description = "A plain, factual summary of what personal information this site collects, why, and who handles it.";

export const metadata: Metadata = {
  title: "Privacy notice",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy notice", description, url: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="temple-home">
      <section className="plan-hero">
        <div className="temple-wrap">
          <p className="temple-kicker">Privacy</p>
          <h1>Privacy <em>notice</em></h1>
          <p className="temple-lead">A plain summary of what {SITE_NAME} collects and why. {POLICY_PENDING_NOTE} It is not a legal compliance guarantee.</p>
        </div>
      </section>
      <section className="temple-wrap plan-section policy-body">
        <h2>What we collect, and why</h2>
        <ul className="plan-list">
          <li><strong>Account:</strong> name, email address and a hashed password, so you can sign in and keep course progress. Membership status is stored with the account.</li>
          <li><strong>Service enquiries:</strong> the name, email and answers you type into the form, only to reply to you. An enquiry is not a booking.</li>
          <li><strong>Newsletter:</strong> your email address, the time you agreed, which form you used and the exact wording you agreed to, only to manage the list. Any email we send includes a personal <Link href="/newsletter/unsubscribe">unsubscribe</Link> link.</li>
          <li><strong>Comments:</strong> the comment text and the name you give or your account name. Comments are shown only after approval.</li>
          <li><strong>Rate limiting:</strong> a one-way hash of your IP address is used briefly to limit repeated sign-ups. The address itself is not stored.</li>
        </ul>

        <h2>Analytics</h2>
        <p>The site counts a short list of actions (for example “a service button was clicked” or “an enquiry was submitted”) as a number per day. These counts contain no email address, IP address, name, device details or form answers, and no third-party analytics provider is loaded. The trip finder runs in your browser and its answers are never sent or stored.</p>

        <h2>Cookies</h2>
        <p>The site uses the cookies needed to keep you signed in. It does not set advertising cookies. Third parties you follow links to (including affiliate partners and Stripe) have their own policies.</p>

        <h2>Payments</h2>
        <p>Membership payments are taken by Stripe when checkout is enabled. We do not see or store your card number. Service enquiries and the guide shop do not take payment.</p>

        <h2>Email</h2>
        <p>Email sending is optional and may not be switched on. If an email provider is configured, it receives your address in order to deliver the message.</p>

        <h2>Your choices</h2>
        <p>Any newsletter email includes a personal unsubscribe link. To ask what we hold about you, to correct it or to have it deleted, contact the site owner. Contact details are still to be published. {POLICY_PENDING_NOTE}</p>

        <p><Link href="/policies">Refunds, cancellations and other policies</Link></p>
      </section>
    </div>
  );
}
