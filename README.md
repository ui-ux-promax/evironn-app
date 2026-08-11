# Evironn

Production rewrite of the Evironn furniture store. The project reuses the proven full-stack foundation from `fashion-shop` while replacing its fashion domain and storefront in controlled phases.

## Stack

- Next.js 15, React 18, TypeScript, Tailwind CSS
- Prisma and Neon Postgres
- Auth.js with credentials and Google OAuth
- Cloudinary, Resend, YooKassa sandbox, DaData
- Upstash Redis, Sentry, Vitest, Playwright, GitHub Actions, Vercel

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and supply local credentials.
3. Generate Prisma Client with `npm run prisma:generate`.
4. Start the app with `npm run dev`.

Database schema and seed commands must target an explicit non-production database. Never commit environment files or credentials.

## Quality gate

```bash
npm run format
npm run gate
npm run build
npm run e2e -- <phase scenarios>
```

## Delivery workflow

`main` contains accepted releases. `dev` contains integrated phase work. Each phase starts from current `dev`, uses its named `phase/*` branch, opens an English pull request into `dev`, and merges with a merge commit after automated checks and required visual acceptance.

Current scope and progress live in [`docs/roadmap`](docs/roadmap).

The inherited fashion UI and domain remain temporary foundation code. They are replaced by the furniture domain and Evironn interfaces in Phases 1–5; deferred blog, newsletter, FAQ, and legal routes are not part of the MVP.
