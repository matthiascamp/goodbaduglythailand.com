import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { getPlanService } from "@/lib/plan-services";
import EnquiryStatusButtons from "./EnquiryStatusButtons";

export const dynamic = "force-dynamic";

function parseDetails(json: string): [string, string][] {
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]): [string, string] => [k, Array.isArray(v) ? v.join(", ") : String(v ?? "")])
      .filter(([, v]) => v !== "");
  } catch {
    return [];
  }
}

export default async function AdminEnquiriesPage() {
  const enquiries = await db.serviceEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-charcoal mb-2">Service enquiries</h1>
      <p className="text-charcoal/60 mb-8">Plan Your Trip enquiries. These are not bookings and no payment has been taken. Reply to the customer by email.</p>
      {enquiries.length === 0 ? (
        <p className="font-serif text-lg text-charcoal/50 py-12 text-center">No enquiries yet.</p>
      ) : (
        <div className="space-y-4">
          {enquiries.map((e) => (
            <article key={e.id} className="bg-cream border border-gold/20 rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-semibold text-charcoal">{getPlanService(e.serviceSlug)?.title ?? e.serviceSlug}{e.packageId ? ` · ${e.packageId}` : ""}</h2>
                  <p className="text-sm text-charcoal/60">
                    {e.name} · <a className="text-gold" href={`mailto:${e.email}`}>{e.email}</a> · {formatDate(e.createdAt)}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold/10 text-gold">{e.status}</span>
              </div>
              <dl className="text-sm grid gap-1 mb-3">
                {parseDetails(e.details).map(([k, v]) => (
                  <div key={k}><dt className="inline font-semibold text-charcoal/70">{k}: </dt><dd className="inline text-charcoal/80">{v}</dd></div>
                ))}
                {e.message && <div><dt className="inline font-semibold text-charcoal/70">message: </dt><dd className="inline text-charcoal/80 whitespace-pre-wrap">{e.message}</dd></div>}
              </dl>
              <EnquiryStatusButtons id={e.id} status={e.status} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
