# Technical plan — Supabase backend + Expo packaging

Based on hands-on review of the live prototype at aura-path-spark.lovable.app
(all 7 screens: home, check-in, journal, goals, library & coach, plus a
`/therapist` coach dashboard that already exists in the prototype).

## 1. Supabase backend

- **Schema**: see [`schema.sql`](./schema.sql) — profiles, coaches,
  coach_clients, check_ins, journal_entries, goals/goal_logs,
  weekly_reflections, sessions, library_content/collections, coach_picks,
  messages.
- **Auth**: Supabase Auth (email/password + optional magic link). A
  `profiles.role` column (`client` | `coach`) drives which UI shell loads
  after login — the prototype's "Sign in" and "Therapist view" links map
  directly onto this.
- **Row Level Security**: every table scoped so a client only ever sees
  their own rows, and a coach only sees rows for clients in their
  `coach_clients` list. The one subtlety worth flagging: the Journal screen
  says *"This entry is private. Only you. You can share specific entries
  with Danielle."* — so journal RLS needs a per-row `shared_with_coach`
  flag, not a blanket "coach sees all client data" policy.

  This isn't just sketched — the schema and policies in this repo were
  spun up on a real local Supabase instance (`supabase start` +
  `supabase db reset`, seeded with data matching Maya/Danielle from the
  prototype) and the journal privacy rule was verified directly against
  Postgres: querying `journal_entries` as the coach's role returns exactly
  the 1 of 3 entries Maya marked shared; querying as Maya returns all 3.
  Also worth noting for the build: table-level `GRANT`s have to accompany
  every RLS policy on newer Supabase projects (auto-exposure to
  `authenticated` is off by default now) — easy to miss and it fails
  closed (permission denied) rather than open, which is the safe direction
  to get wrong, but still worth calling out.
- **Storage**: a private `library-content` bucket for audio/video/PDF
  files. The app never gets a public URL — a small Edge Function issues a
  short-lived signed URL (~1hr) per request, so a leaked link can't be
  replayed indefinitely.
- **Realtime**: Supabase Realtime on the `messages` table for live coach
  messaging without polling.

## 2. Wiring the existing UI to live data

Straightforward per screen — replace the hardcoded arrays with Supabase
queries/mutations:

| Screen | Data source |
|---|---|
| Home | today's `check_ins` row, latest `goals` progress, this week's assigned `library_content`, next `sessions` row |
| Check-in | insert into `check_ins` |
| Journal | CRUD on `journal_entries`, prompt pulled from a small `prompts` table or session context |
| Goals | `goals` + `goal_logs`, weekly grid computed client-side from logs |
| Library & Coach | `library_content`/`library_collections` (signed URLs), `coach_picks`, `messages` |
| Therapist dashboard | aggregate view across `coach_clients` → `check_ins`, `goals`, `sessions.prep_note` |

One decision to make with the client before wiring goals/check-ins: the
prototype uses two different 5-word mood vocabularies on two screens.
Recommend picking one canonical set (stored in the `mood_tags` table) so
copy can change later without a schema migration.

## 3. Expo packaging — the one real scope question

The prototype is a **Lovable-generated Vite + React (web) app** using
shadcn/ui and Tailwind — it is not React Native code. "Wrap it for iOS and
Android with Expo" has two genuinely different meanings, and it changes
both cost and store-approval risk:

**Option A — WebView wrapper** (`expo` + `react-native-webview`)
- Fastest path: point a thin native shell at the hosted web app.
- Cheapest, but: push notifications need a custom bridge (no native
  notification support out of the box), performance/feel is "a website in
  an app," and Apple has a history of rejecting thin WebView wrappers
  under App Store Review Guideline 4.2 ("minimum functionality").

**Option B — Native rebuild in React Native/Expo** (recommended)
- Rebuild the 7 screens as native React Native components, using the
  existing prototype as the exact visual/UX spec (not reused code —
  Tailwind/shadcn don't run in React Native).
- Proper native push notifications (Expo Notifications + APNs/FCM), audio
  playback via `expo-av`, offline-friendly check-ins, no App Store risk.
- More work up front, but it's the only version of "Expo packaging" that
  actually gets the push-notification requirement (check-in reminders,
  new messages, new content) working cleanly.

**Recommendation to state in the proposal: Option B.** Worth confirming
with the client which one they actually meant — some clients say "Expo
packaging" assuming it's a thin wrap, not realizing the UI needs to be
rebuilt. Surfacing this now is a credibility point, not a hedge.

## 4. Push notifications

- Expo push tokens stored per `profiles.id`.
- Three triggers map to existing data: a scheduled check (Supabase cron /
  Edge Function) for check-in reminders if no `check_ins` row exists by a
  set local time; a Postgres trigger on `messages` insert; a trigger on
  `library_content`/`coach_picks` insert for new content.

## Rough phasing (dev-days, no rate assumed — multiply by your rate)

| Phase | Scope | Est. |
|---|---|---|
| 1 | Supabase schema, auth, RLS, storage + signed URLs | 4–6 days |
| 2 | Wire the 6 client screens to live data | 5–7 days |
| 3 | Wire the therapist/coach dashboard (already designed) | 3–4 days |
| 4 | Rebuild UI in Expo/React Native (Option B) + push notifications | 10–14 days |
| 5 | App Store + Play Store submission (assets, review, fixes) | 2–4 days |

~24–35 dev-days total. Phases 1–3 could ship as a web-first MVP before
committing to the Expo rebuild in phase 4, if the client wants to
de-risk spend.
