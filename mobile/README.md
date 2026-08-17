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

- ✅ **Standalone Android APK** — built via `eas build --platform android
  --profile preview` (see `eas.json`), downloaded and installed directly
  (`adb install`, no Expo Go), launched, and clicked through: login,
  real Home/Goals data, a live write against the hosted database, all
  with zero dependency on any dev machine.
- ✅ **Standalone iOS Simulator build** — built via `eas build --platform
  ios --profile preview` (`ios.simulator: true` in `eas.json`, so it needs
  no Apple Developer account), installed on a real iPhone 17 Simulator via
  `xcrun simctl install`, launched, and confirmed rendering the correct
  login screen. Note: this is a **Simulator-only build**, not a
  distributable `.ipa` — a real-device/App-Store build additionally
  needs an Apple Developer Program membership ($99/yr) for code signing,
  which is a real-money account step left for you to own.
- ✅ Static web export (`npx expo export -p web`) deploys cleanly to
  Vercel — same code, same Supabase project, browser-accessible: see the
  live link in the root README.
- ✅ Linked to EAS (`@raghunbaddes-team/wellnesscheck`). Rebuild anytime
  with `eas build --platform android --profile preview` (or `ios`) —
  the download links Expo hosts expire after a while, so regenerate via
  the EAS dashboard or CLI when needed rather than relying on old links.
- ⚠️ **EAS Update (OTA via Expo Go) hit an unresolved platform issue** —
  publishing to a branch/channel and opening it in Expo Go
  (`exp://u.expo.dev/...`) hung indefinitely fetching assets from Expo's
  CDN, independent of environment/config fixes tried (channel linking,
  runtime version policy, cache clearing). Standalone builds (above) were
  used instead and work reliably; OTA updates to those installed builds
  are untested and would need this resolved first — worth a fresh look
  with EAS dashboard access if OTA updates matter for this project later.
- Real bugs hit and fixed along the way, beyond the one below: a stale
  Metro bundler cache silently excluded `EXPO_PUBLIC_*` env vars from
  exported bundles (fix: `--clear` on export), and EAS Build's cloud
  workers have zero access to a local `.env` — the same vars had to be
  registered separately via `eas env:create` for the build to see them.
