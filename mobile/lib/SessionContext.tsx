import { createContext, ReactNode, useContext } from 'react'
import { useSession, Profile } from './useSession'
import type { Session } from '@supabase/supabase-js'

type SessionContextValue = {
  session: Session | null
  profile: Profile | null
  loading: boolean
}

const SessionContext = createContext<SessionContextValue>({ session: null, profile: null, loading: true })

// Single source of truth: useSession() (and its one auth-state subscription)
// runs exactly once here, at the root. Every screen reads from context
// instead of calling useSession() itself — avoiding duplicate subscriptions.
export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useSession()
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSessionContext() {
  return useContext(SessionContext)
}
