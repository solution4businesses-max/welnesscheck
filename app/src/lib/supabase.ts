import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, anonKey)

// Seeded demo accounts (see supabase/seed.sql) — password "password123" for both.
export const DEMO_CLIENT_EMAIL = 'maya@example.com'
export const DEMO_COACH_EMAIL = 'danielle@example.com'
export const DEMO_PASSWORD = 'password123'
