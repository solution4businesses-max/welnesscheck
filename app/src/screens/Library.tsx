import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Content = { id: string; title: string; type: 'audio' | 'video' | 'pdf'; duration_seconds: number | null; is_new: boolean }
type Pick = { coach_note: string; library_content: Content }

const TYPE_LABEL: Record<Content['type'], string> = { audio: 'Audio', video: 'Video', pdf: 'PDF' }

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Library() {
  const [items, setItems] = useState<Content[]>([])
  const [pick, setPick] = useState<Pick | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: content }, { data: picks }] = await Promise.all([
        supabase.from('library_content').select('id, title, type, duration_seconds, is_new').order('created_at'),
        supabase
          .from('coach_picks')
          .select('coach_note, library_content(id, title, type, duration_seconds, is_new)')
          .order('week_of', { ascending: false })
          .limit(1),
      ])
      setItems(content ?? [])
      const p = picks?.[0] as unknown as Pick | undefined
      setPick(p ?? null)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-400 mb-1">Library & Coach</p>
        <h1 className="font-serif text-2xl text-stone-800">What you might need today.</h1>
      </div>

      {pick && (
        <div className="rounded-xl bg-stone-800 text-white p-4">
          <p className="text-[10px] uppercase tracking-wide text-stone-300 mb-2">Coach pick for you · this week</p>
          <p className="text-sm font-medium">{pick.library_content.title}</p>
          <p className="text-xs text-stone-300 mt-1">
            {formatDuration(pick.library_content.duration_seconds)} · {TYPE_LABEL[pick.library_content.type]}
          </p>
          <p className="text-xs italic text-stone-300 mt-3">"{pick.coach_note}"</p>
        </div>
      )}

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-stone-400">Everything</p>
        {loading && <p className="text-sm text-stone-400">Loading…</p>}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-white border border-stone-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-800">{item.title}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {[formatDuration(item.duration_seconds), TYPE_LABEL[item.type]].filter(Boolean).join(' · ')}
              </p>
            </div>
            {item.is_new && (
              <span className="text-[10px] uppercase tracking-wide text-stone-500 border border-stone-300 rounded-full px-2 py-0.5">
                New
              </span>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
