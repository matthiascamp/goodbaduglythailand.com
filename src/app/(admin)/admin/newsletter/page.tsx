import NewsletterAdmin from "./NewsletterAdmin";

export default function AdminNewsletterPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-charcoal mb-3">Newsletter interest</h1>
      <p className="text-charcoal/70 mb-7">People who explicitly registered interest. Email sending and the free checklist are still in preparation. Unsubscribe or delete an address here; only the visitor can consent to subscribe again.</p>
      <NewsletterAdmin />
    </div>
  );
}
