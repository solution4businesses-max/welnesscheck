import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currentWeekISO, WEEKDAY_LABELS, todayISO } from '../lib/dates'

type Goal = {
  id: string
  title: string
  detail: string | null
  target_days_per_week: number
  coach_note: string | null
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [logs, setLogs] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState(true)
  const week = currentWeekISO()
  const today = todayISO()

  async function load() {
    const { data: goalRows } = await supabase
      .from('goals')
      .select('id, title, detail, target_days_per_week, coach_note')
      .eq('status', 'active')
      .order('created_at')
    setGoals(goalRows ?? [])

    if (goalRows?.length) {
      const { data: logRows } = await supabase
        .from('goal_logs')
        .select('goal_id, log_date, completed')
        .in(
          'goal_id',
          goalRows.map((g) => g.id),
        )
        .in('log_date', week)
        .eq('completed', true)
      const byGoal: Record<string, Set<string>> = {}
      for (const l of logRows ?? []) {
        byGoal[l.goal_id] ??= new Set()
        byGoal[l.goal_id].add(l.log_date)
      }
      setLogs(byGoal)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleDay(goalId: string, date: string, done: boolean) {
    if (date > today) return // can't log the future
    if (done) {
      await supabase.from('goal_logs').delete().eq('goal_id', goalId).eq('log_date', date)
    } else {
      await supabase
        .from('goal_logs')
        .upsert({ goal_id: goalId, log_date: date, completed: true }, { onConflict: 'goal_id,log_date' })
    }
    load()
  }

  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-400 mb-1">Goals · This week</p>
        <h1 className="font-serif text-2xl text-stone-800">The work, named.</h1>
      </div>

      {loading && <p className="text-sm text-stone-400">Loading…</p>}

      {goals.map((g) => {
        const done = logs[g.id] ?? new Set<string>()
        return (
          <div key={g.id} className="rounded-xl bg-white border border-stone-200 p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-stone-800 text-sm font-medium">{g.title}</p>
              <p className="text-xs text-stone-400">
                {done.size} of {g.target_days_per_week}
              </p>
            </div>
            {g.detail && <p className="text-xs text-stone-400 mt-0.5">{g.detail}</p>}

            <div className="flex justify-between mt-4">
              {week.map((date, i) => {
                const isDone = done.has(date)
                const isFuture = date > today
                return (
                  <button
                    key={date}
                    disabled={isFuture}
                    onClick={() => toggleDay(g.id, date, isDone)}
                    className={`w-8 h-8 rounded-full text-xs flex items-center justify-center border transition ${
                      isDone
                        ? 'bg-stone-800 text-white border-stone-800'
                        : isFuture
                          ? 'border-stone-100 text-stone-300'
                          : 'border-stone-300 text-stone-500 hover:border-stone-800'
                    }`}
                    title={date}
                  >
                    {WEEKDAY_LABELS[i]}
                  </button>
                )
              })}
            </div>

            {g.coach_note && (
              <p className="text-xs text-stone-500 italic mt-3 border-t border-stone-100 pt-3">
                "{g.coach_note}"
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
