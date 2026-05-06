import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const inputStyle = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #E7E5E4', borderRadius: 12,
  fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#1C1917',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: "'Inter', sans-serif",
        fontSize: 13, fontWeight: 700, color: '#1C1917', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
        color: '#A8A29E', marginTop: 5, margin: '5px 0 0' }}>{hint}</p>}
    </div>
  )
}

function FocusInput({ value, onChange, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input value={value} onChange={onChange} {...props}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle,
        borderColor: focused ? '#2D6A4F' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none' }} />
  )
}

function FocusTextarea({ value, onChange, rows = 3 }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea value={value} onChange={onChange} rows={rows}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle, resize: 'none',
        borderColor: focused ? '#2D6A4F' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none' }} />
  )
}

// Tag input: type + Enter to add, × to remove
function TagInput({ tags, onChange, placeholder }) {
  const [inputVal, setInputVal] = useState('')
  const [focused, setFocused] = useState(false)

  const addTag = () => {
    const v = inputVal.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInputVal('')
  }

  const removeTag = (i) => onChange(tags.filter((_, idx) => idx !== i))

  return (
    <div style={{ border: `1.5px solid ${focused ? '#2D6A4F' : '#E7E5E4'}`,
      borderRadius: 12, padding: '8px 10px', background: '#fff',
      boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {tags.map((tag, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
          backgroundColor: '#F0FAF4', color: '#2D6A4F', border: '1px solid #B7DFC9',
          borderRadius: 8, padding: '3px 10px',
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}>
          {tag}
          <button type="button" onClick={() => removeTag(i)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: '#52B788', fontSize: 15, lineHeight: 1, padding: 0,
              display: 'flex', alignItems: 'center' }}>×</button>
        </span>
      ))}
      <input
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); addTag() }}
        placeholder={tags.length === 0 ? placeholder : 'Add more…'}
        style={{ border: 'none', outline: 'none', flex: 1, minWidth: 120,
          fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#1C1917',
          background: 'transparent', padding: '2px 4px' }}
      />
    </div>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    bio: '', contactInfo: '', avatar: '',
    interestedCourses: [], interestedSubjects: [],
  })

  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => {
        setForm({
          bio:                data.bio               || '',
          contactInfo:        data.contactInfo        || '',
          avatar:             data.avatar             || '',
          interestedCourses:  data.interestedCourses  || [],
          interestedSubjects: data.interestedSubjects || [],
        })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('images', file)
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      set('avatar', data.urls[0])
      toast.success('Avatar uploaded!')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/users/me', form)
      updateUser({ avatar: form.avatar })
      api.delete('/recommendations/cache').catch(() => {})
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: "'Inter', sans-serif", color: '#A8A29E' }}>Loading…</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 30, fontWeight: 600,
          color: '#1C1917', margin: '0 0 4px' }}>My Profile</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#57534E', margin: '0 0 36px' }}>
          Update your info and set your course interests for AI recommendations.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Avatar */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4',
            padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {form.avatar ? (
                <img src={form.avatar} alt="avatar"
                  style={{ width: 80, height: 80, borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid #B7DFC9' }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%',
                  backgroundColor: '#2D6A4F', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#FAFAF8',
                  fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 32 }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600,
                color: '#1C1917', margin: '0 0 2px' }}>{user?.username}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13,
                color: '#A8A29E', margin: '0 0 12px' }}>{user?.email}</p>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ padding: '7px 16px', border: '1.5px solid #E7E5E4', borderRadius: 10,
                  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                  color: '#57534E', background: '#fff', cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s' }}
                onMouseEnter={e => { if (!uploading) e.currentTarget.style.backgroundColor = '#F5F5F4' }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                {uploading ? 'Uploading…' : '📷 Change Avatar'}
              </button>
              <input ref={fileRef} type="file" accept="image/*"
                onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Basic info */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: 16, fontWeight: 600,
              color: '#1C1917', margin: 0 }}>Basic Info</h2>
            <Field label="Bio">
              <FocusTextarea value={form.bio} rows={3}
                onChange={e => set('bio', e.target.value)} />
            </Field>
            <Field label="Contact Info"
              hint="Phone number or other contact — shared when you use 'Share Contact' in chat.">
              <FocusInput type="text" value={form.contactInfo}
                placeholder="e.g. +64 21 123 4567"
                onChange={e => set('contactInfo', e.target.value)} />
            </Field>
          </div>

          {/* AI interests */}
          <div style={{ background: '#fff', borderRadius: 20,
            border: '1.5px solid #B7DFC9', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontFamily: "'Lora', serif", fontSize: 16, fontWeight: 600,
                  color: '#1C1917', margin: 0 }}>AI Recommendation Interests</h2>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  backgroundColor: '#D1FAE5', color: '#065F46',
                  fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em' }}>
                  ✨ AI
                </span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#57534E', margin: 0 }}>
                Tell us what you're studying — our AI uses this to recommend relevant books on the home page.
              </p>
            </div>

            <Field label="Courses"
              hint='Type a course code and press Enter. e.g. "159.333", "178.101"'>
              <TagInput
                tags={form.interestedCourses}
                onChange={val => set('interestedCourses', val)}
                placeholder='Add course code, press Enter…'
              />
            </Field>

            <Field label="Subjects"
              hint='Type a subject and press Enter. e.g. "Computer Science", "Statistics"'>
              <TagInput
                tags={form.interestedSubjects}
                onChange={val => set('interestedSubjects', val)}
                placeholder='Add subject, press Enter…'
              />
            </Field>
          </div>

          {/* Save */}
          <button type="submit" disabled={saving}
            style={{ padding: '14px', backgroundColor: saving ? '#A8A29E' : '#2D6A4F',
              color: '#FAFAF8', border: 'none', borderRadius: 14,
              fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(45,106,79,0.2)', transition: 'background-color 0.2s' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#52B788' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#2D6A4F' }}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>

        </form>
      </div>
    </div>
  )
}
