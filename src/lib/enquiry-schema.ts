import { z } from "zod";
import { PLAN_SERVICES, getPlanService } from "@/lib/plan-services";

export const BUDGET_OPTIONS = ["Under A$2,000", "A$2,000 – A$4,000", "A$4,000 – A$8,000", "Over A$8,000", "Not sure yet"] as const;
export const TRAVEL_STYLES = ["Budget", "Mid-range", "Comfort", "Luxury", "Mixed"] as const;
export const ACTIVITY_OPTIONS = ["Food", "Beaches & islands", "Culture & temples", "Nature & trekking", "Nightlife", "Wellness", "Markets & shopping", "Slow travel"] as const;

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).optional().default("");

const base = {
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  message: optionalText(2000),
  acknowledged: z.literal(true, { error: "Please confirm you understand this is an enquiry, not a booking" }),
  // Honeypot: real users never fill this in.
  website: optionalText(200),
};

export const callEnquirySchema = z.object({
  kind: z.literal("CALL"),
  serviceSlug: z.string(),
  ...base,
  firstVisit: z.enum(["yes", "no", "undecided"], { error: "Please choose an option" }),
  timeframe: text(200).min(1, "Please tell us roughly when"),
  topics: text(1500).min(1, "Please list the questions you most want answered"),
  timezone: optionalText(100),
});

export const itineraryEnquirySchema = z.object({
  kind: z.literal("ITINERARY"),
  serviceSlug: z.string(),
  ...base,
  packageId: z.string().min(1, "Please choose a package"),
  travelDates: text(200).min(1, "Please give your travel dates or approximate month"),
  travellers: z.coerce.number({ error: "Please enter the number of travellers" }).int().min(1).max(30),
  budget: z.enum(BUDGET_OPTIONS, { error: "Please choose a budget" }),
  destinations: text(500).min(1, "Please list destinations of interest (or write 'open')"),
  activities: z.array(z.enum(ACTIVITY_OPTIONS)).max(ACTIVITY_OPTIONS.length).default([]),
  travelStyle: z.enum(TRAVEL_STYLES, { error: "Please choose a travel style" }),
  accommodation: optionalText(500),
  requirements: optionalText(1500),
});

export const enquirySchema = z
  .discriminatedUnion("kind", [callEnquirySchema, itineraryEnquirySchema])
  .superRefine((data, ctx) => {
    const service = getPlanService(data.serviceSlug);
    if (!service || service.kind !== data.kind) {
      ctx.addIssue({ code: "custom", path: ["serviceSlug"], message: "Unknown service" });
      return;
    }
    if (data.kind === "ITINERARY" && !service.packages?.some((p) => p.id === data.packageId)) {
      ctx.addIssue({ code: "custom", path: ["packageId"], message: "Unknown package" });
    }
  });

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const SERVICE_SLUGS = PLAN_SERVICES.map((s) => s.slug);
