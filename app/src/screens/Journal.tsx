import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { friendlyErrorMessage } from '../lib/errors'
import { ErrorBanner } from '../components/ErrorBanner'

type Entry = {
  id: string
  body: string
  prompt_text: string | null
  shared_with_coach: boolean
  created_at: string
}

const PROMPT = "What's one small thing you did today that your future self will thank you for?"

export function Journal() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [draft, setDraft] = useState('')
  const [shared, setShared] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase
        .from('journal_entries')
        .select('id, body, prompt_text, shared_with_coach, created_at')
        .order('created_at', { ascending: false })
      setEntries(data ?? [])
    } catch (e) {
      setError(friendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    if (!draft.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const { data: userData } = await supabase.auth.getUser()
      await supabase.from('journal_entries').insert({
        client_id: userData.user?.id,
        source: 'session',
        prompt_text: PROMPT,
        body: draft.trim(),
        shared_with_coach: shared,
      })
      // Only clear the draft once the write actually succeeds — otherwise
      // a network failure would silently lose what the user just wrote.
      setDraft('')
      setShared(false)
      load()
    } catch (e) {
      setSaveError(friendlyErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-400 mb-1">Journal</p>
        <h1 className="font-serif text-2xl text-stone-800">Today, unfiltered.</h1>
      </div>

      <div className="rounded-xl bg-white border border-stone-200 p-4">
        <p className="text-sm text-stone-500 italic mb-3">"{PROMPT}"</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="Write a few lines…"
          className="w-full resize-none text-sm text-stone-800 outline-none placeholder:text-stone-400"
        />
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 text-xs text-stone-500">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            Share this entry with your coach
          </label>
          <button
            onClick={save}
            disabled={saving || !draft.trim()}
            className="rounded-full bg-stone-800 text-white text-sm px-4 py-1.5 disabled:opacity-40"
          >
            Save
          </button>
        </div>
        {saveError && <p className="text-sm text-red-700 mt-3">{saveError}</p>}
      </div>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-stone-400">Earlier</p>
        {error && <ErrorBanner message={error} onRetry={load} />}
        {loading && <p className="text-sm text-stone-400">Loading…</p>}
        {!error && !loading && entries.length === 0 && <p className="text-sm text-stone-400">No entries yet.</p>}
        {!error &&
          entries.map((e) => (
            <div key={e.id} className="rounded-xl bg-white border border-stone-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-stone-400">
                  {new Date(e.created_at).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                {e.shared_with_coach && (
                  <span className="text-[10px] uppercase tracking-wide text-stone-400 border border-stone-200 rounded-full px-2 py-0.5">
                    Shared with coach
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-700">{e.body}</p>
            </div>
          ))}
      </section>
    </div>
  )
}
