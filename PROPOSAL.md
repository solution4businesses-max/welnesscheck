# Proposal — Supabase backend + Expo packaging for The Pure Path

Hi — I went through the prototype at aura-path-spark.lovable.app in detail
before writing this (all 7 client screens, plus the `/therapist` coach
dashboard) so this proposal is grounded in what's actually built, not just
the brief.

**A couple of things worth flagging that I don't think are in scope-doc
yet:**

- There's already a coach-side screen in the prototype (`/therapist`) —
  client roster card, session-prep note, mood trend, goal progress. Your
  open question about whether a coach interface is needed — it's already
  designed. The real decision is just whether to wire it up in phase 1
  (my recommendation — see below) or defer it.
- The mood-tag vocabulary is actually inconsistent between two screens
  (home uses Tender/Heavy/Steady/Lifted/Open; the check-in flow uses
  Heavy/Low/Steady/Open/Bright). Small thing, but worth settling before
  the check-ins table is built so it's a copy decision, not a migration.
- "Expo packaging" has two different technical meanings for a Lovable-built
  web app (it's Vite/React, not React Native) — a thin WebView wrapper vs.
  a native rebuild of the 7 screens. They cost differently and carry
  different App Store risk. I've laid out both with a recommendation in
  the attached plan rather than assuming.

## What I'd build

1. **Supabase**: full schema (users/coaches, check-ins, journal entries
   with per-entry privacy, goals + daily logs, sessions, library content,
   coach messages), auth, and Row Level Security scoped so a client only
   ever sees their own data and a coach only sees their assigned clients.
   Audio/PDF library content served via short-lived signed URLs, never
   public links.
2. **Wiring**: replace the hardcoded sample data across all 7 screens
   (plus the coach dashboard) with live Supabase queries.
3. **Expo packaging**: recommend a native rebuild in React Native/Expo
   (not a WebView wrap) so push notifications, audio playback, and App
   Store review all work properly — detailed tradeoff in the plan doc.
4. **Push notifications**: check-in reminders, new coach messages, new
   library content — via Expo Notifications, triggered off the same
   database events driving the rest of the app.

Full technical plan, schema, and RLS design: see `docs/architecture-plan.md`
and `docs/schema.sql` in this same submission.

## Proof, not just a plan

Rather than only describing the RLS approach, I built and ran it: the
schema and policies in this proposal are live in a local Supabase instance
(seeded with data matching Maya/Danielle from your own prototype), and I
verified directly against Postgres that a coach querying journal entries
gets back only the ones a client explicitly shared — not the whole
journal. That's runnable locally in one command (`supabase start`), no
account or payment needed, detailed in the README.

## Rough estimate

~24–35 dev-days across schema/auth/RLS, wiring all screens, the coach
dashboard, and the Expo rebuild + store submission — phased breakdown in
`docs/architecture-plan.md`. Happy to start with phases 1–3 (a web-first
MVP on live data) before committing to the Expo rebuild, if you'd like to
de-risk spend before the app-store push.

## Coach interface

My honest read: keep it in scope for phase 1 rather than treating it as a
later add-on — the data model has to support it either way (goal notes,
coach picks, messages all assume a coach producing that content), so
deferring the UI doesn't save the schema work. Full reasoning and a
scoped-down cost if you'd rather split it out: `docs/coach-interface-recommendation.md`.

---

*[Your name / contact / portfolio link — fill in before sending]*
