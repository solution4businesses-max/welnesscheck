import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const links = [
  { to: '/', label: 'Home' },
  { to: '/check-in', label: 'Check-in' },
  { to: '/journal', label: 'Journal' },
  { to: '/goals', label: 'Goals' },
  { to: '/library', label: 'Library' },
]

export function NavBar() {
  return (
    <nav className="sticky bottom-0 border-t border-stone-200 bg-[#f7f4ef]/95 backdrop-blur px-4 py-2 flex items-center justify-between">
      <div className="flex gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `px-3 py-2 rounded-full text-sm transition ${
                isActive ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-xs text-stone-400 hover:text-stone-600 px-2"
      >
        Sign out
      </button>
    </nav>
  )
}
