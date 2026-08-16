# The Pure Path

A full-stack wellness coaching platform — Supabase backend (Postgres,
auth, Row Level Security) wired to two live clients: a React web app and
a React Native/Expo mobile app, sharing the same database and the same
privacy rules.

Originally built as an application for a freelance gig (see
[`PROPOSAL.md`](./PROPOSAL.md) for that context — kept as-is, it's a real
work sample of scoping and client communication). What's here now is a
complete, running reference implementation: real auth, real RLS, real
writes, on real deployed infrastructure — not a mockup.

## Live

- **Web app**: [app-iota-nine-24.vercel.app](https://app-iota-nine-24.vercel.app)
- **Mobile app (web build)**: [mobile-fawn-five.vercel.app](https://mobile-fawn-five.vercel.app)
- **Mobile app (native)**: linked to EAS (`@raghunbaddes-team/wellnesscheck`)
  — verified running via Expo Go on an Android emulator; see
  [`mobile/README.md`](./mobile/README.md) for status on iOS and store builds.

Sign in with either seeded demo account on any of the above —
`maya@example.com` (client) or `danielle@example.com` (coach), password
`password123`. Try: check off a goal or write a journal entry as Maya,
then sign in as Danielle — her dashboard reflects it live. Write a
journal entry and leave "share with coach" off, then check Danielle's
view again — she can't see it. That's Postgres Row Level Security doing
the enforcement, not app-side filtering.

## What's in here

- [`PROPOSAL.md`](./PROPOSAL.md) — the original cover letter / bid text.
- [`docs/architecture-plan.md`](./docs/architecture-plan.md) — the technical
  plan: Supabase design, RLS approach, the Expo packaging decision, push
  notifications, and a rough phased estimate.
- [`docs/coach-interface-recommendation.md`](./docs/coach-interface-recommendation.md)
  — reasoning on whether a coach-side interface is worth building (it is;
  both clients here include one).
- [`supabase/`](./supabase) — the schema + RLS policies
  (`supabase/migrations/`) and seed data (`supabase/seed.sql`) backing
  every client below. Runs locally via the Supabase CLI, no account
  needed, or against the hosted project the live links point at.
- [`app/`](./app) — React + Vite web client: Home, Check-in, Journal
  (per-entry coach-sharing), Goals (weekly grid), Library, and a
  Therapist/coach dashboard.
- [`mobile/`](./mobile) — the same feature set as a React Native/Expo app
  for iOS + Android, sharing the exact same backend. See its README for
  a real bug found and fixed while building it (duplicate auth
  subscriptions causing a request storm) — worth reading if you're
  building your own Supabase + Expo auth flow.

## Run the web app locally

```bash
supabase start        # from the repo root — starts the backend + loads seed data
cd app && npm install && npm run dev
```

## Run the mobile app locally

```bash
supabase start        # if not already running
cd mobile && npm install && npm start
```

Press `i` for iOS simulator, `a` for Android, or scan the QR with Expo Go
on a physical device. See [`mobile/README.md`](./mobile/README.md) for
details and current platform-testing status.

## Run the backend locally (no account needed)

Requires [Docker](https://www.docker.com/) and the
[Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`).

```bash
supabase start
```

This builds the schema, applies RLS policies, and loads seed data for two
demo users — Maya (client) and Danielle (coach). Studio UI opens at the
URL printed in the terminal so you can browse the tables directly.

```bash
supabase stop        # when you're done — data persists in a local Docker volume
```

## Notes on the live deployment

- **Supabase**: hosted free-tier project, schema + seed pushed via
  `supabase db push --include-seed`.
- **Web + mobile-web**: both deployed to Vercel as separate projects from
  the same Supabase backend, proving one database serves multiple
  frontends cleanly.
- **Push notifications, native store builds**: scoped in
  `docs/architecture-plan.md` and `mobile/README.md` but not built here —
  both need real developer accounts (Apple/Google) that are yours to
  create and own.
