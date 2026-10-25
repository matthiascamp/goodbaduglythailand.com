# Static site and Supabase setup

The GitHub Pages site runs without a Node server. The site can receive enquiries through the visitor's email app before Supabase is connected. With Supabase, enquiries go into the owner dashboard, articles can be published, and prices can be edited.

## 1. Create and prepare the Supabase project

1. Create a Supabase project and keep its database password private.
2. In the Supabase SQL Editor, run [`supabase/migrations/20261025_static_sales_site.sql`](supabase/migrations/20261025_static_sales_site.sql) once.
3. Under **Authentication → Users**, create the owner's email/password user. Then run this in the SQL Editor, changing the email if the owner account uses another address:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'merv9280@gmail.com'
   on conflict (user_id) do nothing;
   ```

4. In the Supabase API settings, copy the **Project URL** and **publishable key** (or legacy `anon` key). Do not use the `service_role` or secret key.

The existing SQLite owner login is separate and will not sign in to the static dashboard. Give the Supabase Auth user a new unique password. Do not commit it to Git.

## 2. Connect GitHub Pages

Create an untracked `.env.local` at the repository root with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. They are compiled into browser code and are public by design; row level security protects private data. Never put a service role key here.

Run `./scripts/publish-pages.ps1` in PowerShell to build and push the generated site. In **Settings → Pages**, set **Build and deployment → Source** to **Deploy from a branch**, select `gh-pages` and `/ (root)`. The domain is stored in `public/CNAME`.

## 3. Verify before taking leads

1. Open `/admin.html` and sign in with the Supabase Auth owner account.
2. Change a price and confirm it appears on the public page after refresh.
3. Publish a short article and check `/journal.html`.
4. Send a test enquiry from `/extension.html` and confirm it appears under **Enquiries** in the dashboard. Mark it replied.

The static form does not send an email alert. The owner must check the dashboard for Supabase enquiries. Without Supabase, visitors must finish sending the message in their email app. The service does not currently accept payment or documents.

## Local connected preview

Run `npm run dev:pages`. Vite loads the repository root `.env.local` locally.
