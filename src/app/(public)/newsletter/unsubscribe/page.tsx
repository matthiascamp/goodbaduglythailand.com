import type { Metadata } from "next";
import UnsubscribeForm from "@/components/newsletter/UnsubscribeForm";
import { isValidToken } from "@/lib/newsletter";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;

  return (
    <div className="temple-home">
      <section className="plan-hero">
        <div className="temple-wrap">
          <p className="temple-kicker">Newsletter</p>
          <h1>Unsubscribe</h1>
        </div>
      </section>
      <section className="temple-wrap plan-section">
        {isValidToken(value) ? (
          <UnsubscribeForm token={value} />
        ) : (
          <div className="newsletter-success">
            <p>This page needs the personal unsubscribe link from one of our emails. If the link was cut off, copy the whole address into your browser. If you have no email with a link, no newsletter email has been sent to you yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
