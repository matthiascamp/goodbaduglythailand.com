# Good, Bad & Ugly Thailand

A local Next.js course and membership platform for `goodbadanduglythailand.com`. A member pays once and receives access to the published course library after a verified Stripe webhook confirms payment.

## Start locally

1. Install Node.js 20.9 or newer and run `npm install`.
2. Copy `.env.example` to `.env`. Generate a unique `AUTH_SECRET` (for example with `python -c "import secrets; print(secrets.token_urlsafe(48))"`). Do not commit `.env`.
3. Run `npx prisma migrate deploy` and `npx prisma db seed`.
4. Run `npm run dev -- -H 127.0.0.1 -p 3001` and open `http://localhost:3001`.

The seed creates only topic categories. It does not publish articles, courses, services or shared demo accounts.

## Create an administrator

Set `ADMIN_EMAIL` to the administrator account email, `ADMIN_NAME` to the administrator name, and a unique `ADMIN_PASSWORD` of at least 16 characters while running `npx prisma db seed`. Sign in at `/sign-in` with the full email address. The `admin` username alias is disabled. After saving the password in a password manager, remove `ADMIN_PASSWORD` from `.env`; the password hash stays in the database. Repeat the seed with a new password to rotate the login and revoke existing admin sessions. Eight failed attempts within 15 minutes lock that email for 30 minutes.

For this local checkout, the owner credentials are in `OWNER_LOGIN.txt` at the project root. That file is ignored by Git and must stay private. It applies to this local SQLite database; a separate deployment needs its own owner account and environment configuration. The sign-in page's owner mode is `/sign-in?admin=1`.

Do not run the seed against a production database without reviewing the script and taking a backup.

## Configure one-time membership

Checkout stays disabled until you have:

- Confirmed the real membership price and currency.
- Added real Stripe credentials and a webhook signing secret.
- Published the actual courses and lessons the purchase promises.
- Finalised business details, privacy terms and refund policy.

Set `MEMBERSHIP_PRICE_CENTS` and `MEMBERSHIP_CURRENCY` to the confirmed amount. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; register `/api/webhooks/stripe` as the webhook endpoint. Test a purchase and a full refund in Stripe test mode, then set `ENABLE_CHECKOUT=true`. Use the production domain for `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` before live checkout.

Membership is granted only by a signed, paid Stripe event tagged for the lifetime membership product. Merely returning from checkout does not unlock content. The members area and lesson APIs check access on the server.

## Content and operations

- `/admin/articles`: write and publish journal entries.
- `/admin/resources`: upload, publish, unpublish, and delete downloadable files. The public `/resources` page lists published items; member-only downloads require an active membership.
- To use an uploaded image as a journal cover, upload it under Resources, set access to **Everyone**, publish it, then select it in the article editor's cover image field. Images already used as covers cannot be unpublished or deleted until the article cover is changed.
- `/admin/courses`: create courses, modules and lessons.
- `/admin/services`: manage advice offerings.
- `/admin/pricing`: set the public prices for the featured Plan Your Trip consultations, itinerary packages, guide previews and one-time membership. These are separate from the older `/admin/services` catalogue. The itinerary headline follows its 7-day package. A membership amount of A$0 means the price is unset. Guide prices remain previews; setting a price does not enable guide checkout. Membership checkout uses the saved amount only when `ENABLE_CHECKOUT=true` and Stripe/webhook credentials are configured. New Stripe sessions use inline price data, so no Stripe Price ID must be changed when the owner edits the amount. Existing sessions keep the amount quoted when they were created.
- `/admin/newsletter`: inspect registered interest and unsubscribe or delete an address. The owner cannot re-subscribe a person without fresh consent; this screen does not send campaigns.
- Service prices are entered in the selected currency's main unit (for example, `197.00` AUD) and shown on the public Advice page. Online service booking and payment are still in preparation; the existing Stripe checkout handles membership only.
- `/admin/comments`: approve or remove reader comments.
- `/admin/users`: inspect member status.

The author biography, real course materials, membership price, legal policies, business contact details and deployment target have not been supplied. These must be completed before launch. The public site deliberately avoids fabricated testimonials, prices and claims. Published articles and resources marked **PUBLIC** remain free by design; courses and resources marked **MEMBER** require membership or an admin account.

Resource files of any type up to 100 MB are stored outside `public/` and served as attachments for downloads. Published public images selected as journal covers are the only exception: the site displays safe raster formats through a dedicated image route. Set `RESOURCE_STORAGE_DIR` to an **absolute path on a persistent volume** for production, back up that directory with the database, and keep it private. A temporary serverless filesystem is unsuitable for uploaded resources. Larger videos need private video hosting: a public or unlisted URL pasted into a lesson can still be shared outside the site.

## Newsletter and guide shop (preview)

- **Newsletter:** sign-up forms on the home page, articles, footer, `/newsletter` and the guide shop store the email, consent time, source and the exact consent wording in the `NewsletterSubscriber` table. Duplicates are ignored without revealing whether an address is registered; sign-ups are rate limited per hashed IP and globally, with a honeypot field. Each subscriber has an unguessable unsubscribe token; `/newsletter/unsubscribe?token=...` shows a confirm button and POSTs to `/api/newsletter/unsubscribe` (a GET never unsubscribes anyone).
- **No email is sent by default.** The checklist “15 Things You Need to Know Before Visiting Thailand” does not exist yet. To try a confirmation email, set `RESEND_API_KEY` and `NEWSLETTER_FROM_EMAIL` (unsubscribe links use `NEXT_PUBLIC_SITE_URL`). The site only says an email was sent if Resend accepts the request. Sending campaigns, the checklist file and a privacy policy reviewed for your jurisdiction still need to be supplied; the on-page privacy note is a plain summary, not a compliance guarantee.
- **Guide shop:** `/guide-shop` and `/guide-shop/[slug]` are driven by `src/lib/guide-products.ts`. All four products have status `preview`: there are no files, no checkout and no purchase buttons. `src/lib/guide-payments.ts` lists what is missing before guide sales (Stripe products, a separate verified webhook, protected file storage). Membership checkout is untouched.
- **Membership comparison:** `src/lib/membership-plans.ts` marks benefits `live` or `planned`. The A$9/month figure is stored only as a proposal and is never shown as an option; membership remains one-time.

## Trip finder, contextual offers, analytics and policies (Phase 3)

- **Trip finder (`/trip-finder`):** rules in `src/lib/trip-finder.ts`; no AI. It runs entirely in the browser, so answers are not sent, stored or counted. Article links come from the published `Article` rows (matched on title, excerpt and category); if none match it says so and links to `/articles`. Suggested service and guide-preview links come from `plan-services.ts` and `guide-products.ts`.
- **Article offers:** `src/lib/article-relevance.ts` scores each article's own title (2 points) and excerpt/category (1 point) per topic and needs at least 2 points. Result: at most one planning service plus at most one guide *preview* link, or nothing. The slug and body are not used. Affiliate blocks appear only for real entries in `src/lib/affiliates.ts`. The author note uses only the owner-provided "approximately 18 years" fact; no name, stories or testimonials.
- **Analytics:** first-party counter in the `AnalyticsDaily` table (event, UTC day, count). No email, IP, user agent, URL or answers are stored and no third-party provider is loaded. Set `ANALYTICS_ENABLED=false` to disable. Browser-reported events (`service_cta_click`, `affiliate_outbound_click`, `guide_purchase_intent`) go to `POST /api/analytics`, which is same-origin only, size limited, restricted to that whitelist, burst limited in memory per hashed IP (30/min, not persisted) and capped at 20,000 per event per day. Server events: `enquiry_submitted`, `itinerary_enquiry_submitted`, `newsletter_subscribe`, `guide_release_interest` (newsletter sign-up from a guide page), `membership_signup` (account created), `membership_checkout_started` (Stripe session created) and `purchase_completed`. `purchase_completed` is recorded only inside the signature-verified Stripe webhook after payment is confirmed, once per session (the idempotency guard); the success URL never counts. View counts with `npx prisma studio` (table `analytics_daily`). To add an external provider later, extend `trackEvent` in `src/lib/analytics.ts` behind its own env variable and keep the same name-only payload.
- **Legal pages:** `/privacy` and `/policies` are plain factual summaries. Refund, cancellation and digital product terms are marked "Final policy pending owner review" and must be replaced with real terms (and contact details) before launch. They are linked from the footer, enquiry forms, newsletter forms, membership and the guide shop.
- **SEO:** `metadataBase` comes from `NEXT_PUBLIC_SITE_URL` (set it to the production domain). New pages and articles have unique titles, canonical URLs, Open Graph data, and articles carry `Article` JSON-LD credited to the site (no personal author name has been supplied). Sitemap includes the new pages. Admin, member and sign-in/up pages are `noindex`.

### Real-content gates before launch
1. Owner-approved author name and bio (About page, article JSON-LD).
2. Real refund/cancellation terms, privacy review for your jurisdiction and contact details.
3. Real affiliate links in `ARTICLE_AFFILIATES` (otherwise none are shown).
4. Guide files, prices, a guide checkout and a verified webhook before any guide is sold; the checklist file and an email provider before email delivery is claimed.
5. A$9/month is a proposal only; membership checkout stays one-time.

## Deployment

This checkout is local and uses SQLite. Production needs a persistent database and backups. If hosting on a serverless platform, migrate to a managed database and produce a compatible Prisma migration before deploying. Configure the domain and TLS at the selected host, enter environment variables there, register the production Stripe webhook, then run `npm run build` and verify sign-up, payment, webhook entitlement, refund handling, admin editing, and mobile layouts on the deployed URL.

## Checks

Run `npx tsc --noEmit`, `npm run build`, and `npm audit --omit=dev` after dependency changes. A clean build alone does not verify a live payment: the Stripe test flow requires your test account and keys.
