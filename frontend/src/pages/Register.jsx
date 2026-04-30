import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function InputField({ label, type, placeholder, value, onChange, required, minLength }) {
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
        minLength={minLength}
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

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      toast.success('Account created! Welcome to BookSwap 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* Left: Brand Panel */}
      <div className="hidden lg:flex flex-col" style={{
        flexDirection: 'column', justifyContent: 'space-between',
        width: '40%', backgroundColor: '#1C1917', padding: '48px',
      }}>
        <div>
          <span style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 600, color: '#D4A853' }}>
            📚 BookSwap
          </span>
        </div>
        <div>
          <p style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600,
            color: '#FAFAF8', lineHeight: 1.4, marginBottom: 20 }}>
            Join thousands of students saving money on textbooks.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['List your books in minutes', 'Chat directly with buyers & sellers', 'Save money every semester'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#2D6A4F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" fill="none" stroke="#FAFAF8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(250,250,248,0.75)' }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
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
            Join BookSwap
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#57534E', marginBottom: 36 }}>
            Create your account to start exchanging
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <InputField
              label="Username" type="text" placeholder="johndoe" required
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
            />
            <InputField
              label="Email" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <InputField
              label="Password" type="password" placeholder="At least 6 characters" required minLength={6}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                backgroundColor: loading ? '#A8A29E' : '#2D6A4F',
                color: '#FAFAF8', border: 'none', borderRadius: 14,
                fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 2px 8px rgba(45,106,79,0.25)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#52B788' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#2D6A4F' }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, fontFamily: "'Inter', sans-serif",
            fontSize: 14, color: '#57534E' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}