import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { currentWeekISO } from '../../lib/dates'
import { Screen, Eyebrow, Title, Card, SignOutButton, ErrorBanner } from '../../components/ui'
import { friendlyErrorMessage } from '../../lib/errors'
import { colors } from '../../lib/theme'

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

export default function Therapist() {
  const [cards, setCards] = useState<ClientCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: coachClients } = await supabase
        .from('coach_clients')
        .select('client_id, program_started_on, program_length_weeks')

      const week = currentWeekISO()
      const built: ClientCard[] = []

      for (const cc of coachClients ?? []) {
        const [{ data: profile }, { data: checkIns }, { data: goals }, { data: session }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', cc.client_id).single(),
          supabase.from('check_ins').select('mood_slug').eq('client_id', cc.client_id).in('check_in_date', week),
          supabase.from('goals').select('id, title, target_days_per_week').eq('client_id', cc.client_id).eq('status', 'active'),
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
    } catch (e) {
      setError(friendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const weeksSinceStart = (started: string) =>
    Math.max(1, Math.ceil((Date.now() - new Date(started).getTime()) / (7 * 24 * 60 * 60 * 1000)))

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Eyebrow>Therapist dashboard</Eyebrow>
          <Title>Your clients.</Title>
        </View>
        <SignOutButton />
      </View>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <ActivityIndicator />}
      {!error && !loading && cards.length === 0 && <Text style={styles.muted}>No clients assigned yet.</Text>}

      {!error &&
        cards.map((c) => (
          <Card key={c.client_id}>
            <View style={styles.headerRow}>
              <Text style={styles.clientName}>{c.full_name}</Text>
              <Text style={styles.muted}>
                Week {weeksSinceStart(c.program_started_on)} of {c.program_length_weeks}
              </Text>
            </View>

            {c.prepNote && (
              <View style={styles.prepBox}>
                <Text style={styles.prepEyebrow}>
                  {c.sessionAt &&
                    new Date(c.sessionAt).toLocaleString(undefined, {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                  · prep ready
                </Text>
                <Text style={styles.prepNote}>"{c.prepNote}"</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mood trend</Text>
              <Text style={styles.sectionValue}>
                {Object.entries(c.moodCounts).map(([mood, n]) => `${mood} ×${n}`).join(' · ') || 'No check-ins this week'}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Goals</Text>
              <Text style={styles.sectionValue}>
                {c.goals.map((g) => `${g.title} ${g.done}/${g.target}`).join(' · ') || 'No active goals'}
              </Text>
            </View>
          </Card>
        ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  clientName: { fontFamily: undefined, fontSize: 16, fontWeight: '600', color: colors.ink },
  muted: { color: colors.faint, fontSize: 12 },
  prepBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 10, marginTop: 10 },
  prepEyebrow: { fontSize: 10, textTransform: 'uppercase', color: colors.faint, marginBottom: 4 },
  prepNote: { fontStyle: 'italic', color: colors.ink, fontSize: 13 },
  section: { marginTop: 10 },
  sectionLabel: { fontSize: 10, textTransform: 'uppercase', color: colors.faint, marginBottom: 2 },
  sectionValue: { fontSize: 13, color: colors.muted },
})
