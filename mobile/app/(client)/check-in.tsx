import { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { todayISO } from '../../lib/dates'
import { Screen, Eyebrow, Title, ErrorBanner } from '../../components/ui'
import { friendlyErrorMessage } from '../../lib/errors'
import { colors } from '../../lib/theme'

type MoodTag = { slug: string; label: string }

export default function CheckIn() {
  const [moods, setMoods] = useState<MoodTag[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const router = useRouter()

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
        .upsert({ client_id, mood_slug: slug, check_in_date: todayISO() }, { onConflict: 'client_id,check_in_date' })
      router.push('/(client)')
    } catch (e) {
      setSaveError(friendlyErrorMessage(e))
      setSaving(null)
    }
  }

  return (
    <Screen>
      <Eyebrow>Today</Eyebrow>
      <Title>How are you feeling?</Title>
      <Text style={styles.subtitle}>No wrong answer. We're tracking trends, not judging today.</Text>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <ActivityIndicator />}
      {saveError && <Text style={styles.saveErrorText}>{saveError}</Text>}

      {!error && !loading && (
        <View style={styles.grid}>
          {moods.map((m) => (
            <TouchableOpacity
              key={m.slug}
              style={styles.moodButton}
              onPress={() => pick(m.slug)}
              disabled={saving !== null}
            >
              {saving === m.slug ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.moodLabel}>{m.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  saveErrorText: { color: '#a13f37', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moodButton: {
    width: '47%',
    paddingVertical: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  moodLabel: { color: colors.ink, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
})
