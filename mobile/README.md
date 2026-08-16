# The Pure Path — Expo mobile app

Native iOS/Android client for the same backend as [`../app`](../app) (the
React web version). Same Supabase project, same schema, same RLS policies —
this is the concrete answer to "wire the UI to live data + package for
Expo": one backend, two clients, both live.

Built with Expo Router (file-based navigation), TypeScript, and
`@supabase/supabase-js` with `AsyncStorage`-backed session persistence.

## Run it

```bash
cp .env.example .env   # Supabase anon key + URL — safe to expose client-side, protected by RLS
npm install
npm start        # then press `i` for iOS simulator, `a` for Android, or scan the QR with Expo Go
```

Sign in with the same seeded demo accounts as the web app (`maya@example.com`
/ `danielle@example.com`, password `password123` — see `../supabase/seed.sql`).

## Structure

```
app/
  _layout.tsx          # SessionProvider + role-based routing gate (see below)
  (client)/            # Tabs: Home, Check-in, Journal, Goals, Library
  (coach)/              # Therapist dashboard
lib/
  supabase.ts          # Supabase client (RN: AsyncStorage + URL polyfill)
  SessionContext.tsx   # Single shared auth/profile subscription
  useSession.ts        # The underlying hook (see "a real bug" below)
  dates.ts, theme.ts
components/
  LoginScreen.tsx, ui.tsx
```

## A real bug this surfaced (worth knowing if you build on this)

Every screen originally called its own `useSession()` — including the root
layout *and* the Home screen. Each call subscribes to
`supabase.auth.onAuthStateChange`, so two call sites meant two live
subscriptions. On web (tested via `expo start --web`), tab navigation
remounts screens, which repeatedly re-subscribed and re-fired auth events,
compounding into a request storm that eventually crashed the tab
(`ERR_INSUFFICIENT_RESOURCES`).

Fix: `lib/SessionContext.tsx` wraps `useSession()` exactly once, at the
root, in a `Context.Provider`. Every screen reads from context instead of
calling the hook directly. One subscription for the lifetime of the app,
regardless of how many screens mount and unmount.

Caught by testing the actual click-through flow (not just type-checking or
a single screenshot) — a reminder that "renders once" and "survives
navigation" are different bars.

## Expo packaging status

- ✅ **Verified running natively on Android** — installed Expo Go on a
  real emulator, launched the project over the dev server, and clicked
  through login, Home, and Goals, including a live write (toggling a
  goal day off/on and watching the count update against the hosted
  Postgres database). Screenshots of this run are in the PR/session
  history; not re-committed here to keep the repo lean.
- ✅ Static web export (`npx expo export -p web`) deploys cleanly to
  Vercel — same code, same Supabase project, browser-accessible: see the
  live link in the root README.
- ✅ Linked to EAS (`@raghunbaddes-team/wellnesscheck`) and published via
  `eas update` — viewable through the EAS dashboard's Updates tab
  (scan the QR with Expo Go from a phone).
- ⏳ **iOS Simulator**: blocked in the environment this was built in —
  Xcode was installed but never had its command-line tools path selected
  (`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`,
  needs a local password prompt neither an agent nor a remote session can
  supply). The code itself is platform-agnostic RN/Expo — nothing here is
  Android-specific — so this is an environment gap, not a code gap.
- ⏳ Native release builds (EAS Build → `.ipa`/`.aab` for App Store/Play
  Store submission) — needs an Apple Developer account ($99/yr) for iOS
  and a Play Console account ($25 one-time) for Android; not created here
  since that's a real-money, real-account step for you to own.
