import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useSessionContext } from '../../lib/SessionContext'
import { currentWeekISO, todayISO } from '../../lib/dates'
import { Screen, Eyebrow, Title, Card, SignOutButton } from '../../components/ui'
import { colors } from '../../lib/theme'

type Goal = { id: string; title: string; target_days_per_week: number }
type SessionRow = { scheduled_at: string; duration_minutes: number }

export default function Home() {
  const { profile } = useSessionContext()
  const router = useRouter()
  const [checkedInToday, setCheckedInToday] = useState<boolean | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [nextSession, setNextSession] = useState<SessionRow | null>(null)
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
            .in('goal_id', goalRows.map((g) => g.id))
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

  if (!profile) return null
  const firstName = profile.full_name.split(' ')[0]

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Eyebrow>Live from Supabase</Eyebrow>
          <Title>Good morning, {firstName}.</Title>
          <Text style={styles.subtitle}>One small thing today. That's the system.</Text>
        </View>
        <SignOutButton />
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <TouchableOpacity onPress={() => router.push('/(client)/check-in')}>
            <Card style={checkedInToday ? undefined : styles.checkInActive}>
              <Text style={[styles.cardEyebrow, checkedInToday ? undefined : styles.onDark]}>
                Quick check-in
              </Text>
              <Text style={[styles.checkInText, checkedInToday ? undefined : styles.onDark]}>
                {checkedInToday ? "You've checked in today." : 'How are you arriving?'}
              </Text>
            </Card>
          </TouchableOpacity>

          <View>
            <Text style={styles.sectionLabel}>This week</Text>
            <View style={{ gap: 8 }}>
              {goals.length === 0 && <Text style={styles.muted}>No active goals yet.</Text>}
              {goals.map((g) => (
                <Card key={g.id}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={styles.muted}>
                    {progress[g.id] ?? 0} of {g.target_days_per_week} this week
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.sectionLabel}>Next session</Text>
            {nextSession ? (
              <Card>
                <Text style={styles.goalTitle}>
                  {new Date(nextSession.scheduled_at).toLocaleString(undefined, {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  · {nextSession.duration_minutes} min
                </Text>
              </Card>
            ) : (
              <Text style={styles.muted}>Nothing scheduled.</Text>
            )}
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.faint,
    marginBottom: 8,
  },
  muted: { color: colors.faint, fontSize: 13 },
  goalTitle: { color: colors.ink, fontSize: 14, marginBottom: 4 },
  checkInActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  cardEyebrow: { fontSize: 11, textTransform: 'uppercase', color: colors.faint, marginBottom: 4 },
  checkInText: { fontFamily: undefined, fontSize: 17, color: colors.ink },
  onDark: { color: '#fff' },
})
