import { useState } from 'react'
import { supabase, DEMO_CLIENT_EMAIL, DEMO_COACH_EMAIL, DEMO_PASSWORD } from '../lib/supabase'

export function Login() {
  const [busy, setBusy] = useState<'client' | 'coach' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signIn(as: 'client' | 'coach') {
    setBusy(as)
    setError(null)
    const email = as === 'client' ? DEMO_CLIENT_EMAIL : DEMO_COACH_EMAIL
    const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
    if (error) setError(error.message)
    setBusy(null)
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-3">The Pure Path</p>
        <h1 className="font-serif text-3xl text-stone-800 mb-2">A daily anchor between sessions.</h1>
        <p className="text-stone-500 text-sm mb-10">
          Live demo — real Supabase auth, real Postgres, real row-level security.
        </p>

        <button
          onClick={() => signIn('client')}
          disabled={busy !== null}
          className="w-full rounded-full bg-stone-800 text-white py-3 mb-3 disabled:opacity-50 hover:bg-stone-700 transition"
        >
          {busy === 'client' ? 'Signing in…' : 'Continue as Maya (client)'}
        </button>
        <button
          onClick={() => signIn('coach')}
          disabled={busy !== null}
          className="w-full rounded-full border border-stone-300 text-stone-700 py-3 disabled:opacity-50 hover:bg-stone-100 transition"
        >
          {busy === 'coach' ? 'Signing in…' : 'Continue as Danielle (coach)'}
        </button>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <p className="text-xs text-stone-400 mt-10">
          Seeded demo accounts — see supabase/seed.sql. No real data.
        </p>
      </div>
    </div>
  )
}
