import { getPlanService } from "@/lib/plan-services";

/** Best-effort owner alert. The full enquiry stays in the private dashboard. */
export async function notifyOwnerOfEnquiry(serviceSlug: string, name: string, email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM_EMAIL || process.env.NEWSLETTER_FROM_EMAIL;
  const to = process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !to) return;

  const service = getPlanService(serviceSlug)?.title ?? "Service enquiry";
  const dashboard = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/admin/enquiries`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: `New ${service} enquiry`,
        text: `New enquiry for ${service}\n\nName: ${name}\nEmail: ${email}\n\nView the full enquiry and reply from your dashboard: ${dashboard}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) console.error("[enquiry] owner notification was not accepted");
  } catch {
    console.error("[enquiry] owner notification failed");
  }
}
