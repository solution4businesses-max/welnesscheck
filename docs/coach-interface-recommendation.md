# Is a coach-side interface needed?

**Short answer: it's already designed — the open question is really just
"do we wire it up in this phase," not "should it exist."**

The live prototype at aura-path-spark.lovable.app has a fourth, undocumented
screen at `/therapist` (linked from the home screen as "Therapist view →")
showing:

- A client roster entry ("Maya R. · Week 3 of 12")
- A session-prep card with the client's own words ("Want to talk about the
  doorway moment with Marcus...")
- Mood trend for the week (Steady ×3 · Lifted ×1 · Heavy ×2)
- Goal progress mirrored from the client app
- An "Open full prep" action (destination screen not yet designed)

This means the design work for a v1 coach view is done. What's undecided
is scope and timing:

## Recommendation

Build a **minimal coach view in the same phase** as the client app, not as
a follow-on project:

- It shares the same Supabase schema and RLS model — a coach dashboard is
  mostly *read* queries against tables (`check_ins`, `goals`,
  `journal_entries` where shared, `sessions`) that already have to exist
  for the client app to work. Deferring it doesn't save schema work, only
  UI work.
- Coaches are the ones assigning goals, leaving the "FROM DANIELLE" notes,
  and picking library content for clients — several client-side features
  (goal coach_note, coach_picks, messages) assume a coach is producing
  that content somewhere. Without a coach interface, someone has to write
  directly into the database to make the client app look alive, which
  isn't sustainable past a demo.

## Rough cost if scoped separately

If the client wants to explicitly de-scope it to a later phase:

- **Read-only coach dashboard** (client roster + prep card + mood/goal
  trends, no messaging/content authoring): ~3–4 dev-days, reusing the
  existing prototype screen 1:1.
- **Full coach interface** (also: send messages, assign/edit goals, pick
  library content, add session prep notes): ~7–10 additional dev-days on
  top of the read-only version.

Either way, the marginal cost of *not* building it now is low, since the
data model is shared — the honest advice here is to keep it in scope
rather than pitch it as a separate add-on.
