import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { todayISO } from '../lib/dates'
import { friendlyErrorMessage } from '../lib/errors'
import { ErrorBanner } from '../components/ErrorBanner'

type MoodTag = { slug: string; label: string }

export function CheckIn() {
  const [moods, setMoods] = useState<MoodTag[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase.from('mood_tags').select('slug, label').order('sort_order')
      setMoods(data ?? [])
    } catch (e) {
      setError(friendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function pick(slug: string) {
    setSaving(slug)
    setSaveError(null)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const client_id = userData.user?.id
      await supabase
        .from('check_ins')
        .upsert(
          { client_id, mood_slug: slug, check_in_date: todayISO() },
          { onConflict: 'client_id,check_in_date' },
        )
      navigate('/')
    } catch (e) {
      setSaveError(friendlyErrorMessage(e))
      setSaving(null)
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-8">
      <p className="text-xs uppercase tracking-wide text-stone-400 mb-1">Today</p>
      <h1 className="font-serif text-2xl text-stone-800 mb-1">How are you feeling?</h1>
      <p className="text-stone-500 text-sm mb-8">No wrong answer. We're tracking trends, not judging today.</p>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={load} />
        </div>
      )}
      {loading && <p className="text-stone-400 text-sm">Loading…</p>}
      {saveError && <p className="text-sm text-red-700 mb-4">{saveError}</p>}

      {!error && !loading && (
        <div className="grid grid-cols-2 gap-3">
          {moods.map((m) => (
            <button
              key={m.slug}
              onClick={() => pick(m.slug)}
              disabled={saving !== null}
              className="rounded-xl border border-stone-200 bg-white py-6 text-stone-700 uppercase text-sm tracking-wide hover:border-stone-800 disabled:opacity-50 transition"
            >
              {saving === m.slug ? '…' : m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
