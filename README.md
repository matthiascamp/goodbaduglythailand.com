# The Good, Bad & Ugly of Thailand

The live site is a static sales site published to GitHub Pages at [goodbaduglythailand.com](https://goodbaduglythailand.com). It needs no Node server. Merv's extension paperwork service and enquiry path are the focus. Until Supabase is connected, enquiry forms open an email to `merv9280@gmail.com` for the visitor to send.

## Local preview

```sh
npm ci
npm run dev:pages
```

`npm run build:pages` produces `pages-dist/`. Run `./scripts/publish-pages.ps1` to build and publish that directory to the generated `gh-pages` branch. GitHub Pages serves that branch. The `public/CNAME` file preserves the custom domain.

## Connect Supabase

See [STATIC_SETUP.md](STATIC_SETUP.md). The SQL migration adds enquiries, articles, prices and an owner role protected by row level security. The public publishable key can be used by the browser. Never put a Supabase service role or secret key in a GitHub Pages build.

The earlier Next.js/Prisma version remains in `src/` and `prisma/` as a local legacy implementation. Its member library, downloads, checkout and server routes are **not part of the static GitHub Pages deployment**. `npm run dev` and `npm run build` still target that legacy app; use the `:pages` scripts for the live site.
