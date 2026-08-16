import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Same seeded demo accounts as the web app (supabase/seed.sql) — both
// clients point at the same hosted Supabase project.
export const DEMO_CLIENT_EMAIL = 'maya@example.com'
export const DEMO_COACH_EMAIL = 'danielle@example.com'
export const DEMO_PASSWORD = 'password123'
