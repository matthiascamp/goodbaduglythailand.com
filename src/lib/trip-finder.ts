import { topicScores, type Topic } from "@/lib/article-relevance";

/**
 * Rules-based trip finder. Pure functions, no network, no AI, nothing stored.
 * Advice is general and qualitative: it does not quote prices, visa rules or guarantees.
 */

export const PURPOSES = [
  { value: "holiday", label: "A holiday" },
  { value: "relocation", label: "Moving or a long stay" },
] as const;
export const DURATIONS = ["Under a week", "1–2 weeks", "3–4 weeks", "1–3 months", "3 months or more"] as const;
export const BUDGETS = ["Under A$2,000", "A$2,000 – A$4,000", "A$4,000 – A$8,000", "Over A$8,000", "Not sure yet"] as const;
export const STYLES = ["Relaxed and beachy", "Culture and food", "Adventure and nature", "Nightlife and cities", "A mix"] as const;
export const EXPERIENCES = [
  { value: "first", label: "First time in Thailand" },
  { value: "returning", label: "I have been before" },
] as const;

export interface TripAnswers {
  purpose: (typeof PURPOSES)[number]["value"];
  duration: (typeof DURATIONS)[number];
  budget: (typeof BUDGETS)[number];
  style: (typeof STYLES)[number];
  experience: (typeof EXPERIENCES)[number]["value"];
}

export interface FinderArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
}

export interface TripResult {
  headline: string;
  advice: string[];
  serviceSlug: string;
  guideSlug: string | null;
  articles: FinderArticle[];
}

function adviceFor(a: TripAnswers): string[] {
  const out: string[] = [];

  if (a.purpose === "relocation") {
    out.push("Treat the first stay as a trial. Rent short-term in the area you are considering before signing a long lease or buying anything.");
    out.push("Visit in more than one season if you can. Heat, rain and air quality change daily life a lot depending on the region.");
    out.push("Visa and residency rules change and depend on your nationality. Check the Thai embassy or immigration bureau directly rather than relying on forums or agents' summaries.");
    out.push("Sort health insurance and a way to move money before you arrive, not after.");
    if (a.budget === "Under A$2,000") out.push("A tight budget leaves little margin for surprises such as medical costs or a lease deposit, so keep a buffer.");
    if (a.duration === "3 months or more") out.push("For a stay this long, rent monthly rather than nightly once you have chosen an area; it is usually easier to negotiate in person.");
    if (a.experience === "first") out.push("If you have only visited as a tourist, spend time living like a resident (groceries, transport, clinics) before deciding.");
    return out;
  }

  if (a.duration === "Under a week") out.push("With under a week, choose one base and one optional day trip. Transfers use more time than most people expect.");
  else if (a.duration === "1–2 weeks") out.push("In one to two weeks, two bases is a comfortable maximum, for example a city plus one other region.");
  else out.push("With three weeks or more you can add a third base or slow down. Staying longer in fewer places usually feels better than constant moving.");

  if (a.style === "Relaxed and beachy") out.push("Thailand's coasts have different wet and dry seasons. Check the typical weather for your travel month before choosing a coast.");
  if (a.style === "Culture and food") out.push("Temples and markets are best early or late in the day to avoid the heat and the crowds. Dress to cover shoulders and knees at temples.");
  if (a.style === "Adventure and nature") out.push("Book trekking, diving and wildlife experiences only with operators that put safety and animal welfare first, and read recent reviews.");
  if (a.style === "Nightlife and cities") out.push("In nightlife areas, agree prices before ordering, keep an eye on your drinks and use a metered taxi or ride app to get home.");
  if (a.style === "A mix") out.push("A mix works well if you separate the legs: a city first, then a slower beach or nature stop to recover.");

  if (a.budget === "Under A$2,000") out.push("On a tighter budget, travel outside peak holiday periods, fly or train between fewer places and eat where locals eat.");
  if (a.budget === "Over A$8,000") out.push("With a generous budget, spend it on location and fewer, better stays instead of more stops.");
  if (a.budget === "Not sure yet") out.push("If you are unsure of your budget, decide the number of nights and bases first; accommodation and internal transport shape most of the cost.");

  if (a.experience === "first") out.push("Be sceptical of anyone who says an attraction is closed or offers a very cheap tour on the street. Use official ticket offices and ride apps or metered taxis.");
  else out.push("Since you have been before, consider a region you have not seen, or the same place outside the usual season, instead of repeating the classic circuit.");

  return out;
}

export function recommend(a: TripAnswers, articles: FinderArticle[]): TripResult {
  let serviceSlug: string;
  let guideSlug: string | null;
  const want: Topic[] = [];

  if (a.purpose === "relocation") {
    serviceSlug = "moving-to-thailand-consultation";
    guideSlug = "moving-to-thailand-checklist";
    want.push("relocation");
  } else {
    const wantsWrittenPlan = a.duration !== "Under a week" && (a.experience === "returning" || a.duration !== "1–2 weeks" || a.style === "A mix");
    serviceSlug = wantsWrittenPlan ? "custom-thailand-itinerary" : "thailand-insider-consultation";
    guideSlug = a.experience === "first" ? "first-timer-survival" : null;
    want.push("travel", "itinerary");
    if (a.experience === "first") want.push("firstTimer", "scam");
    if (a.style === "Nightlife and cities") want.push("bangkok");
  }

  const articlesRanked = articles
    .map((art) => {
      const s = topicScores(art);
      return { art, score: want.reduce((n, t) => n + s[t], 0) };
    })
    .filter((x) => x.score >= 2)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map((x) => x.art);

  return {
    headline: a.purpose === "relocation" ? "Thinking about living in Thailand" : `A ${a.duration.toLowerCase()} Thailand trip`,
    advice: adviceFor(a),
    serviceSlug,
    guideSlug,
    articles: articlesRanked,
  };
}
