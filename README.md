# The Good, Bad & Ugly of Thailand

An independent Thailand editorial site built with Next.js 16, Prisma and SQLite. It includes public articles, a member library, service enquiries, newsletter interest, a guide shop preview and an owner studio.

## Run locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set a unique `AUTH_SECRET` and the other local values you need.
3. Run `npx prisma migrate deploy` and `npm run db:seed`.
4. Run `npm run dev -- -p 3001` and open `http://localhost:3001`.

For a production build, run `npm run build` and then `npm run start -- -p 3001`. See [SETUP.md](SETUP.md) for the owner account, content, payment and launch requirements.

## Before connecting the domain

This is a server-rendered Node application, not a static site. The server needs persistent database and private resource storage across deployments. The current SQLite setup is suitable for local work; choose a persistent production database and storage plan before accepting sign-ups or payments. Set the production domain in `AUTH_URL` and `NEXT_PUBLIC_SITE_URL`, create a separate production owner account, and test the Stripe webhook before enabling checkout.

Guide downloads, affiliate links, email delivery and final legal policies still require real content or configuration. The local `.env`, database, uploads and `OWNER_LOGIN.txt` are intentionally excluded from Git.
