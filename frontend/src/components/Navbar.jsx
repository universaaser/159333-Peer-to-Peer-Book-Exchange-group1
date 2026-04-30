import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100">
      <div className="w-full px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline flex-shrink-0"
          style={{ textDecoration: 'none' }}
        >
          <span className="text-xl" role="img" aria-label="book">📚</span>
          <span style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 20, color: '#1C1917' }}>
            BookSwap
          </span>
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" label="Browse" active={isActive('/')} />
          {user && <NavLink to="/listings/create" label="Sell a Book" active={isActive('/listings/create')} />}
          {user && <NavLink to="/messages" label="Messages" active={isActive('/messages')} />}
          {user && <NavLink to="/transactions" label="Transactions" active={isActive('/transactions')} />}
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: '#2D6A4F', fontFamily: "'Inter', sans-serif" }}>
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: '#1C1917' }}>
                  {user.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: '#57534E',
                  background: 'none', border: '1px solid #E7E5E4', borderRadius: 12,
                  padding: '7px 16px', cursor: 'pointer' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
                  color: '#57534E', textDecoration: 'none' }}>
                Sign in
              </Link>
              <Link to="/register"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                  backgroundColor: '#2D6A4F', color: '#FAFAF8', padding: '8px 18px',
                  borderRadius: 12, textDecoration: 'none', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#52B788'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D6A4F'}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      style={{
        fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
        color: active ? '#2D6A4F' : '#57534E',
        backgroundColor: active ? '#F0FDF4' : 'transparent',
        padding: '6px 14px', borderRadius: 10, textDecoration: 'none',
        transition: 'color 0.15s, background-color 0.15s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#2D6A4F'; e.currentTarget.style.backgroundColor = '#F0FDF4' }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#57534E'; e.currentTarget.style.backgroundColor = 'transparent' }}}
    >
      {label}
    </Link>
  )
}