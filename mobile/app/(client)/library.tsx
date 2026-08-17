import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Screen, Eyebrow, Title, Card, ErrorBanner } from '../../components/ui'
import { friendlyErrorMessage } from '../../lib/errors'
import { colors } from '../../lib/theme'

type Content = { id: string; title: string; type: 'audio' | 'video' | 'pdf'; duration_seconds: number | null; is_new: boolean }
type Pick = { coach_note: string; library_content: Content }

const TYPE_LABEL: Record<Content['type'], string> = { audio: 'Audio', video: 'Video', pdf: 'PDF' }

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Library() {
  const [items, setItems] = useState<Content[]>([])
  const [pick, setPick] = useState<Pick | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
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
    } catch (e) {
      setError(friendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Screen>
      <Eyebrow>Library & Coach</Eyebrow>
      <Title>What you might need today.</Title>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <ActivityIndicator />}

      {!error && pick && (
        <View style={styles.pickCard}>
          <Text style={styles.pickEyebrow}>Coach pick for you · this week</Text>
          <Text style={styles.pickTitle}>{pick.library_content.title}</Text>
          <Text style={styles.pickMeta}>
            {[formatDuration(pick.library_content.duration_seconds), TYPE_LABEL[pick.library_content.type]]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={styles.pickNote}>"{pick.coach_note}"</Text>
        </View>
      )}

      {!error && (
        <>
          <Text style={styles.sectionLabel}>Everything</Text>
          {items.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>
                  {[formatDuration(item.duration_seconds), TYPE_LABEL[item.type]].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {item.is_new && <Text style={styles.newBadge}>New</Text>}
            </Card>
          ))}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pickCard: { backgroundColor: colors.dark, borderRadius: 16, padding: 16 },
  pickEyebrow: { fontSize: 10, textTransform: 'uppercase', color: '#c9c4b8', marginBottom: 8 },
  pickTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pickMeta: { color: '#c9c4b8', fontSize: 12, marginTop: 2 },
  pickNote: { color: '#c9c4b8', fontStyle: 'italic', fontSize: 12, marginTop: 10 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { color: colors.ink, fontSize: 14 },
  itemMeta: { color: colors.faint, fontSize: 12, marginTop: 2 },
  newBadge: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
})
