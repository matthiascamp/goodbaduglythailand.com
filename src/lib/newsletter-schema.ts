import { z } from "zod";

/** Exact wording shown next to the consent checkbox; stored with each signup. */
export const NEWSLETTER_CONSENT_TEXT =
  "I agree to receive emails from The Good, Bad & Ugly of Thailand about the free checklist and future updates. I can unsubscribe at any time.";

export const NEWSLETTER_STATUS_NOTE =
  "The checklist “15 Things You Need to Know Before Visiting Thailand” and email delivery are still in preparation. Registering now records your interest and consent; we will only email you once sending is switched on.";

export const NEWSLETTER_PRIVACY_NOTE =
  "We store your email address, the time you agreed and which form you used, only to manage this list. Any email we send will include a personal unsubscribe link. This is a plain summary, not a full privacy policy.";

const SOURCE = /^[a-z0-9][a-z0-9:_\-./]{0,79}$/i;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  consent: z.literal(true, { error: "Please tick the box to agree to receive emails" }),
  source: z.string().trim().regex(SOURCE, "Invalid source"),
  // Honeypot: real users never fill this in.
  website: z.string().max(200).optional().default(""),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
