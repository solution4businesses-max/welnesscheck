import { View, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { SessionProvider, useSessionContext } from '../lib/SessionContext'
import { LoginScreen } from '../components/LoginScreen'
import { colors } from '../lib/theme'

// Single source of truth for auth + role routing. Only one child Stack.Screen
// is ever registered at a time, so there's no route collision between
// (client)/index and (coach)/index — both would otherwise resolve to "/"
// since route groups don't add a URL segment.
export default function RootLayout() {
  return (
    <SessionProvider>
      <Gate />
    </SessionProvider>
  )
}

function Gate() {
  const { session, profile, loading } = useSessionContext()

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {loading && session ? (
        <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : !session || !profile ? (
        <LoginScreen />
      ) : profile.role === 'coach' ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(coach)" />
        </Stack>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(client)" />
        </Stack>
      )}
    </SafeAreaProvider>
  )
}
