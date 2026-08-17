import { ReactNode } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { colors, serif } from '../lib/theme'

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 32, gap: 16 }}
    >
      {children}
    </ScrollView>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function SignOutButton() {
  return (
    <TouchableOpacity onPress={() => supabase.auth.signOut()}>
      <Text style={styles.signOut}>Sign out</Text>
    </TouchableOpacity>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onRetry}>
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.faint,
    marginBottom: 2,
  },
  title: {
    fontFamily: serif,
    fontSize: 24,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  signOut: {
    color: colors.faint,
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: '#fbeceb',
    borderWidth: 1,
    borderColor: '#e8b4b0',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  errorText: {
    color: '#a13f37',
    fontSize: 13,
  },
  retryText: {
    color: '#a13f37',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
