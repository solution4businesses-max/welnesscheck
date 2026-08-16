import { Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './lib/useSession'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { CheckIn } from './screens/CheckIn'
import { Journal } from './screens/Journal'
import { Goals } from './screens/Goals'
import { Library } from './screens/Library'
import { Therapist } from './screens/Therapist'
import { NavBar } from './components/NavBar'

export default function App() {
  const { session, profile, loading } = useSession()

  if (loading && session) {
    return <div className="min-h-svh flex items-center justify-center text-stone-400 text-sm">Loading…</div>
  }

  if (!session || !profile) {
    return <Login />
  }

  if (profile.role === 'coach') {
    return <Therapist />
  }

  return (
    <div className="min-h-svh flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home profile={profile} />} />
          <Route path="/check-in" element={<CheckIn />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/library" element={<Library />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <NavBar />
    </div>
  )
}
