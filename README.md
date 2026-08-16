# The Pure Path — backend proposal

Application materials for the "Supabase backend + Expo packaging" gig for
the wellness coaching app currently live at
[aura-path-spark.lovable.app](https://aura-path-spark.lovable.app).

## What's in here

- [`PROPOSAL.md`](./PROPOSAL.md) — the cover letter / bid text.
- [`docs/architecture-plan.md`](./docs/architecture-plan.md) — the technical
  plan: Supabase design, RLS approach, the Expo packaging decision, push
  notifications, and a rough phased estimate.
- [`docs/coach-interface-recommendation.md`](./docs/coach-interface-recommendation.md)
  — answer to the open "do we need a coach-side interface" question.
- [`supabase/`](./supabase) — a **working**, runnable local Supabase project:
  full schema + RLS policies (`supabase/migrations/`) and seed data modeled
  on the prototype's own content (`supabase/seed.sql`).
- [`app/`](./app) — a **working sample app** (React + Vite), not just a
  schema: Home, Check-in, Journal (with per-entry coach-sharing), Goals
  (weekly grid, writes to Postgres), Library, and a Therapist/coach
  dashboard — all reading and writing the live Supabase backend above, with
  RLS actually enforced (sign in as the coach and you cannot see the
  client's private journal entries; sign in as the client and you can).

## Run the sample app

```bash
supabase start        # from the repo root — starts the backend + loads seed data
cd app && npm install && npm run dev
```

Open the printed localhost URL and sign in as either seeded demo account
right from the login screen (no typing credentials — there's a button for
each). Try: check in as Maya, tick off a goal, write a journal entry and
toggle "share with coach," then sign out and sign back in as Danielle — the
goal progress and mood trend update live, and only the journal entry you
shared is visible.

## Run the backend locally (no account needed)

Requires [Docker](https://www.docker.com/) and the
[Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`).

```bash
supabase start
```

This builds the schema, applies RLS policies, and loads seed data for two
demo users — Maya (client) and Danielle (coach) — matching the names and
content already in the prototype. Studio UI opens at the URL printed in
the terminal so you can browse the tables directly.

```bash
supabase stop        # when you're done with the standalone backend
```

when you're done — it leaves the data in a local Docker volume, so
`supabase start` again picks up where you left off.

## If you want a live (not just local) demo

No paid infrastructure needed for a demo of this scope:

- **Supabase**: the free tier (2 free projects, no card required) is enough
  to host this schema for a demo/proposal stage. Create a project at
  supabase.com, then `supabase link` + `supabase db push` from this repo.
- **Frontend hosting + free subdomain**: Vercel or Netlify's free tier
  gives you a `*.vercel.app` / `*.netlify.app` HTTPS subdomain with no DNS
  purchase — plenty for a demo link to attach to a proposal. A custom
  domain is only worth buying once this is a real, paying product.
- **Push notifications**: Expo's push service is free and doesn't require
  a separate Firebase project for iOS; Android push through Expo does need
  a free Firebase project for FCM credentials (no billing required at this
  scale).

I didn't spin these up as part of this proposal since they all require
account creation — happy to do it together once you're ready to move
forward, or hand you the exact steps.

## Next steps if this proposal moves forward

1. You create the GitHub repo (I can't create accounts on your behalf) —
   then share the URL and I'll push this content and start from there.
2. Confirm the Expo packaging approach (see the "Option A vs B" call in
   `docs/architecture-plan.md`) — it changes both cost and scope.
3. Decide whether the coach dashboard ships in phase 1 (recommended) or is
   scoped separately — see `docs/coach-interface-recommendation.md`.
