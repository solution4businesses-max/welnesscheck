import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/useSession'
import { currentWeekISO, todayISO } from '../lib/dates'

type Goal = { id: string; title: string; target_days_per_week: number }
type Session = { scheduled_at: string; duration_minutes: number }

export function Home({ profile }: { profile: Profile }) {
  const [checkedInToday, setCheckedInToday] = useState<boolean | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [nextSession, setNextSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ data: checkIn }, { data: goalRows }, { data: sessionRows }] = await Promise.all([
        supabase.from('check_ins').select('id').eq('check_in_date', todayISO()).maybeSingle(),
        supabase
          .from('goals')
          .select('id, title, target_days_per_week')
          .eq('status', 'active')
          .order('created_at'),
        supabase
          .from('sessions')
          .select('scheduled_at, duration_minutes')
          .gt('scheduled_at', new Date().toISOString())
          .order('scheduled_at')
          .limit(1),
      ])
      if (cancelled) return
      setCheckedInToday(!!checkIn)
      setGoals(goalRows ?? [])
      setNextSession(sessionRows?.[0] ?? null)

      const week = currentWeekISO()
      if (goalRows?.length) {
        const { data: logs } = await supabase
          .from('goal_logs')
          .select('goal_id, log_date, completed')
          .in(
            'goal_id',
            goalRows.map((g) => g.id),
          )
          .in('log_date', week)
          .eq('completed', true)
        if (!cancelled && logs) {
          const counts: Record<string, number> = {}
          for (const log of logs) counts[log.goal_id] = (counts[log.goal_id] ?? 0) + 1
          setProgress(counts)
        }
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const firstName = profile.full_name.split(' ')[0]

  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-8">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-1">Live from Supabase</p>
        <h1 className="font-serif text-2xl text-stone-800">Good morning, {firstName}.</h1>
        <p className="text-stone-500 text-sm mt-1">One small thing today. That's the system.</p>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading…</p>
      ) : (
        <>
          <Link
            to="/check-in"
            className={`block rounded-2xl p-5 border transition ${
              checkedInToday
                ? 'border-stone-200 bg-white text-stone-400'
                : 'border-stone-800 bg-stone-800 text-white hover:bg-stone-700'
            }`}
          >
            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Quick check-in</p>
            <p className="font-serif text-lg">
              {checkedInToday ? "You've checked in today." : 'How are you arriving?'}
            </p>
          </Link>

          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wide text-stone-400">This week</p>
              <Link to="/goals" className="text-xs text-stone-500 underline">
                All goals →
              </Link>
            </div>
            <div className="space-y-2">
              {goals.length === 0 && <p className="text-sm text-stone-400">No active goals yet.</p>}
              {goals.map((g) => (
                <div key={g.id} className="rounded-xl bg-white border border-stone-200 p-4">
                  <p className="text-stone-800 text-sm">{g.title}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {progress[g.id] ?? 0} of {g.target_days_per_week} this week
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Next session</p>
            {nextSession ? (
              <div className="rounded-xl bg-white border border-stone-200 p-4 text-sm text-stone-700">
                {new Date(nextSession.scheduled_at).toLocaleString(undefined, {
                  weekday: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                })}{' '}
                · {nextSession.duration_minutes} min
              </div>
            ) : (
              <p className="text-sm text-stone-400">Nothing scheduled.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
