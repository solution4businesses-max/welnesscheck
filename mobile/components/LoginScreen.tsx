import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase, DEMO_CLIENT_EMAIL, DEMO_COACH_EMAIL, DEMO_PASSWORD } from '../lib/supabase'
import { colors, serif } from '../lib/theme'
import { friendlyErrorMessage } from '../lib/errors'

export function LoginScreen() {
  const [busy, setBusy] = useState<'client' | 'coach' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signIn(as: 'client' | 'coach') {
    setBusy(as)
    setError(null)
    const email = as === 'client' ? DEMO_CLIENT_EMAIL : DEMO_COACH_EMAIL
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
      if (error) setError(friendlyErrorMessage(error))
    } catch (e) {
      setError(friendlyErrorMessage(e))
    }
    setBusy(null)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>THE PURE PATH</Text>
      <Text style={styles.title}>A daily anchor between sessions.</Text>
      <Text style={styles.subtitle}>Live demo — Expo + real Supabase auth, real Postgres, real RLS.</Text>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => signIn('client')}
        disabled={busy !== null}
      >
        {busy === 'client' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Continue as Maya (client)</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => signIn('coach')}
        disabled={busy !== null}
      >
        {busy === 'coach' ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Text style={styles.secondaryButtonText}>Continue as Danielle (coach)</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.footnote}>Seeded demo accounts — see supabase/seed.sql. No real data.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  eyebrow: {
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 3,
    color: colors.faint,
    marginBottom: 12,
  },
  title: {
    fontFamily: serif,
    fontSize: 28,
    textAlign: 'center',
    color: colors.ink,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    marginBottom: 40,
    lineHeight: 20,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.dark,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#c0392b',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },
  footnote: {
    textAlign: 'center',
    color: colors.faint,
    fontSize: 12,
    marginTop: 40,
  },
})
