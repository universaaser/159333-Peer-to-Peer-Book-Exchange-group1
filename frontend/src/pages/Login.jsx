import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function InputField({ label, type, placeholder, value, onChange, required }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 14,
        fontWeight: 600, color: '#1C1917', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '12px 16px',
          border: `1.5px solid ${focused ? '#2D6A4F' : '#E7E5E4'}`,
          borderRadius: 14, background: '#fff',
          fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#1C1917',
          outline: 'none', boxSizing: 'border-box',
          boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [adminMode, setAdminMode] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(form.email, form.password)
      if (adminMode) {
        if (data.user.role !== 'admin') {
          toast.error('This account does not have admin privileges')
          return
        }
        toast.success('Welcome, Admin!')
        navigate('/admin')
      } else {
        toast.success('Welcome back!')
        navigate('/')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* Left: Brand Panel */}
      <div style={{
        display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        width: '40%', backgroundColor: '#1C1917', padding: '48px',
        '@media (min-width: 1024px)': { display: 'flex' },
      }} className="hidden lg:flex flex-col">
        <div>
          <span style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 600, color: '#D4A853' }}>
            📚 BookSwap
          </span>
        </div>
        <div>
          <blockquote style={{
            fontFamily: "'Lora', serif", fontStyle: 'italic',
            color: 'rgba(250,250,248,0.8)', fontSize: 20, lineHeight: 1.7, marginBottom: 16,
          }}>
            "A reader lives a thousand lives before he dies. The man who never reads lives only one."
          </blockquote>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(250,250,248,0.4)' }}>
            — George R.R. Martin
          </p>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(250,250,248,0.3)' }}>
          Share books. Build community.
        </p>
      </div>

      {/* Right: Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', backgroundColor: '#FAFAF8',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 32, fontWeight: 600,
            color: '#1C1917', marginBottom: 8 }}>
            Welcome back
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#57534E', marginBottom: 36 }}>
            Sign in to your BookSwap account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <InputField
              label="Email" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <InputField
              label="Password" type="password" placeholder="••••••••" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            />

            {/* Admin mode toggle */}
            <button
              type="button"
              onClick={() => setAdminMode(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${adminMode ? '#1C1917' : '#E7E5E4'}`,
                background: adminMode ? '#1C1917' : '#F5F5F4',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 16 }}>🛡️</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                color: adminMode ? '#FAFAF8' : '#57534E', flex: 1, textAlign: 'left' }}>
                Sign in as Administrator
              </span>
              <div style={{
                width: 36, height: 20, borderRadius: 999,
                backgroundColor: adminMode ? '#D4A853' : '#D1D5DB',
                position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%',
                  backgroundColor: '#fff', transition: 'left 0.2s',
                  left: adminMode ? 19 : 3,
                }} />
              </div>
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                backgroundColor: loading ? '#A8A29E' : adminMode ? '#1C1917' : '#2D6A4F',
                color: '#FAFAF8', border: 'none', borderRadius: 14,
                fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
                boxShadow: adminMode
                  ? '0 2px 8px rgba(28,25,23,0.3)'
                  : '0 2px 8px rgba(45,106,79,0.25)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = adminMode ? '#292524' : '#52B788' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = adminMode ? '#1C1917' : '#2D6A4F' }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? 'Signing in...' : adminMode ? '🛡️ Sign In as Admin' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, fontFamily: "'Inter', sans-serif",
            fontSize: 14, color: '#57534E' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}