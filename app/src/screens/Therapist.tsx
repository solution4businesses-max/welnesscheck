import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currentWeekISO } from '../lib/dates'

type ClientCard = {
  client_id: string
  full_name: string
  program_started_on: string
  program_length_weeks: number
  moodCounts: Record<string, number>
  goals: { title: string; done: number; target: number }[]
  prepNote: string | null
  sessionAt: string | null
}

export function Therapist() {
  const [cards, setCards] = useState<ClientCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: coachClients } = await supabase
        .from('coach_clients')
        .select('client_id, program_started_on, program_length_weeks')

      const week = currentWeekISO()
      const built: ClientCard[] = []

      for (const cc of coachClients ?? []) {
        const [{ data: profile }, { data: checkIns }, { data: goals }, { data: session }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', cc.client_id).single(),
          supabase
            .from('check_ins')
            .select('mood_slug')
            .eq('client_id', cc.client_id)
            .in('check_in_date', week),
          supabase
            .from('goals')
            .select('id, title, target_days_per_week')
            .eq('client_id', cc.client_id)
            .eq('status', 'active'),
          supabase
            .from('sessions')
            .select('scheduled_at, prep_note')
            .eq('client_id', cc.client_id)
            .gt('scheduled_at', new Date().toISOString())
            .order('scheduled_at')
            .limit(1)
            .maybeSingle(),
        ])

        const moodCounts: Record<string, number> = {}
        for (const c of checkIns ?? []) moodCounts[c.mood_slug] = (moodCounts[c.mood_slug] ?? 0) + 1

        const goalsWithProgress = []
        for (const g of goals ?? []) {
          const { count } = await supabase
            .from('goal_logs')
            .select('*', { count: 'exact', head: true })
            .eq('goal_id', g.id)
            .in('log_date', week)
            .eq('completed', true)
          goalsWithProgress.push({ title: g.title, done: count ?? 0, target: g.target_days_per_week })
        }

        built.push({
          client_id: cc.client_id,
          full_name: profile?.full_name ?? 'Client',
          program_started_on: cc.program_started_on,
          program_length_weeks: cc.program_length_weeks,
          moodCounts,
          goals: goalsWithProgress,
          prepNote: session?.prep_note ?? null,
          sessionAt: session?.scheduled_at ?? null,
        })
      }

      setCards(built)
      setLoading(false)
    }
    load()
  }, [])

  const weeksSinceStart = (started: string) =>
    Math.max(1, Math.ceil((Date.now() - new Date(started).getTime()) / (7 * 24 * 60 * 60 * 1000)))

  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-400 mb-1">Therapist dashboard</p>
        <h1 className="font-serif text-2xl text-stone-800">Your clients.</h1>
      </div>

      {loading && <p className="text-sm text-stone-400">Loading…</p>}
      {!loading && cards.length === 0 && <p className="text-sm text-stone-400">No clients assigned yet.</p>}

      {cards.map((c) => (
        <div key={c.client_id} className="rounded-xl bg-white border border-stone-200 p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="font-serif text-lg text-stone-800">{c.full_name}</p>
            <p className="text-xs text-stone-400">
              Week {weeksSinceStart(c.program_started_on)} of {c.program_length_weeks}
            </p>
          </div>

          {c.prepNote && (
            <div className="bg-stone-50 border border-stone-100 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-1">
                {c.sessionAt &&
                  new Date(c.sessionAt).toLocaleString(undefined, {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                · prep ready
              </p>
              <p className="text-sm text-stone-700 italic">"{c.prepNote}"</p>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-1">Mood trend</p>
            <p className="text-sm text-stone-600">
              {Object.entries(c.moodCounts)
                .map(([mood, n]) => `${mood} ×${n}`)
                .join(' · ') || 'No check-ins this week'}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-1">Goals</p>
            <p className="text-sm text-stone-600">
              {c.goals.map((g) => `${g.title} ${g.done}/${g.target}`).join(' · ') || 'No active goals'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
