import { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { currentWeekISO, WEEKDAY_LABELS, todayISO } from '../../lib/dates'
import { Screen, Eyebrow, Title, Card, ErrorBanner } from '../../components/ui'
import { friendlyErrorMessage } from '../../lib/errors'
import { colors } from '../../lib/theme'

type Goal = {
  id: string
  title: string
  detail: string | null
  target_days_per_week: number
  coach_note: string | null
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [logs, setLogs] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const week = currentWeekISO()
  const today = todayISO()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
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
          .in('goal_id', goalRows.map((g) => g.id))
          .in('log_date', week)
          .eq('completed', true)
        const byGoal: Record<string, Set<string>> = {}
        for (const l of logRows ?? []) {
          byGoal[l.goal_id] ??= new Set()
          byGoal[l.goal_id].add(l.log_date)
        }
        setLogs(byGoal)
      }
    } catch (e) {
      setError(friendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleDay(goalId: string, date: string, done: boolean) {
    if (date > today) return
    try {
      if (done) {
        await supabase.from('goal_logs').delete().eq('goal_id', goalId).eq('log_date', date)
      } else {
        await supabase
          .from('goal_logs')
          .upsert({ goal_id: goalId, log_date: date, completed: true }, { onConflict: 'goal_id,log_date' })
      }
      load()
    } catch (e) {
      setError(friendlyErrorMessage(e))
    }
  }

  return (
    <Screen>
      <Eyebrow>Goals · This week</Eyebrow>
      <Title>The work, named.</Title>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <ActivityIndicator />}

      {!error &&
        goals.map((g) => {
          const done = logs[g.id] ?? new Set<string>()
          return (
            <Card key={g.id}>
              <View style={styles.headerRow}>
                <Text style={styles.goalTitle}>{g.title}</Text>
                <Text style={styles.muted}>
                  {done.size} of {g.target_days_per_week}
                </Text>
              </View>
              {g.detail && <Text style={styles.detail}>{g.detail}</Text>}

              <View style={styles.dayRow}>
                {week.map((date, i) => {
                  const isDone = done.has(date)
                  const isFuture = date > today
                  return (
                    <TouchableOpacity
                      key={date}
                      disabled={isFuture}
                      onPress={() => toggleDay(g.id, date, isDone)}
                      style={[
                        styles.dayCircle,
                        isDone && styles.dayCircleDone,
                        isFuture && styles.dayCircleFuture,
                      ]}
                    >
                      <Text style={[styles.dayLabel, isDone && styles.dayLabelDone, isFuture && styles.dayLabelFuture]}>
                        {WEEKDAY_LABELS[i]}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {g.coach_note && <Text style={styles.coachNote}>"{g.coach_note}"</Text>}
            </Card>
          )
        })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  muted: { color: colors.faint, fontSize: 12 },
  detail: { color: colors.faint, fontSize: 12, marginTop: 2 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleDone: { backgroundColor: colors.dark, borderColor: colors.dark },
  dayCircleFuture: { borderColor: colors.border },
  dayLabel: { fontSize: 12, color: colors.muted },
  dayLabelDone: { color: '#fff' },
  dayLabelFuture: { color: colors.border },
  coachNote: {
    fontStyle: 'italic',
    color: colors.muted,
    fontSize: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
