import { useCallback, useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Screen, Eyebrow, Title, Card, ErrorBanner } from '../../components/ui'
import { friendlyErrorMessage } from '../../lib/errors'
import { colors } from '../../lib/theme'

type Entry = {
  id: string
  body: string
  shared_with_coach: boolean
  created_at: string
}

const PROMPT = "What's one small thing you did today that your future self will thank you for?"

export default function Journal() {
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
        .select('id, body, shared_with_coach, created_at')
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
    <Screen>
      <Eyebrow>Journal</Eyebrow>
      <Title>Today, unfiltered.</Title>

      <Card>
        <Text style={styles.prompt}>"{PROMPT}"</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          numberOfLines={4}
          placeholder="Write a few lines…"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
        <View style={styles.row}>
          <View style={styles.shareRow}>
            <Switch value={shared} onValueChange={setShared} />
            <Text style={styles.shareLabel}>Share with coach</Text>
          </View>
          <TouchableOpacity
            onPress={save}
            disabled={saving || !draft.trim()}
            style={[styles.saveButton, (saving || !draft.trim()) && { opacity: 0.4 }]}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        {saveError && <Text style={styles.saveErrorText}>{saveError}</Text>}
      </Card>

      <Text style={styles.sectionLabel}>Earlier</Text>
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <ActivityIndicator />}
      {!error && !loading && entries.length === 0 && <Text style={styles.muted}>No entries yet.</Text>}
      {!error &&
        entries.map((e) => (
          <Card key={e.id}>
            <View style={styles.entryHeader}>
              <Text style={styles.muted}>
                {new Date(e.created_at).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              {e.shared_with_coach && <Text style={styles.badge}>Shared with coach</Text>}
            </View>
            <Text style={styles.entryBody}>{e.body}</Text>
          </Card>
        ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  prompt: { fontStyle: 'italic', color: colors.muted, fontSize: 13, marginBottom: 10 },
  input: { color: colors.ink, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareLabel: { fontSize: 12, color: colors.muted },
  saveButton: { backgroundColor: colors.dark, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  saveButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  saveErrorText: { color: '#a13f37', fontSize: 12, marginTop: 8 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
  muted: { color: colors.faint, fontSize: 13 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  badge: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  entryBody: { color: colors.ink, fontSize: 14 },
})
