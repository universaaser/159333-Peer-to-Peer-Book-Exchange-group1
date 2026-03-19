import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: "'Inter', sans-serif",
        fontSize: 14, fontWeight: 600, color: '#1C1917', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
        color: '#A8A29E', marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #E7E5E4', borderRadius: 12,
  fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#1C1917',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function StyledInput({ value, onChange, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      value={value} onChange={onChange} {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        borderColor: focused ? '#2D6A4F' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none',
      }}
    />
  )
}

function StyledTextarea({ value, onChange, rows = 4, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value} onChange={onChange} rows={rows} {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle, resize: 'none',
        borderColor: focused ? '#2D6A4F' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none',
      }}
    />
  )
}

function StyledSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value} onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle, cursor: 'pointer',
        borderColor: focused ? '#2D6A4F' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none',
      }}
    >
      {children}
    </select>
  )
}

export default function CreateListing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])   // File objects
  const [previews, setPreviews] = useState([])        // base64 preview URLs
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    condition: 'Good', author: '', edition: '', course: '', subject: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5)
    setImageFiles(files)
    const readers = files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = ev => resolve(ev.target.result)
      reader.readAsDataURL(file)
    }))
    Promise.all(readers).then(setPreviews)
  }

  const removeImage = (index) => {
    setImageFiles(f => f.filter((_, i) => i !== index))
    setPreviews(p => p.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. 如果有图片，先上传
      let imageUrls = []
      if (imageFiles.length > 0) {
        const formData = new FormData()
        imageFiles.forEach(f => formData.append('images', f))
        const { data: uploadData } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        imageUrls = uploadData.urls
      }

      // 2. 创建 listing
      const { data } = await api.post('/listings', {
        ...form,
        price: Number(form.price),
        images: imageUrls,
      })
      toast.success('Listing submitted! It will appear after admin approval.')
      navigate(`/listings/${data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E',
          textDecoration: 'none', marginBottom: 28 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 32, fontWeight: 600,
            color: '#1C1917', margin: '0 0 8px' }}>
            List a Book
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#57534E', margin: 0 }}>
            Fill in the details below to list your textbook for sale or exchange.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #E7E5E4',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)', padding: '36px 32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <Field label="Book Title *">
              <StyledInput
                type="text" required
                placeholder="e.g. Introduction to Algorithms"
                value={form.title} onChange={e => set('title', e.target.value)}
              />
            </Field>

            <Field label="Description *">
              <StyledTextarea
                required rows={4}
                placeholder="Describe the book — edition, any marks, highlights, etc."
                value={form.description} onChange={e => set('description', e.target.value)}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Price (NZD) *">
                <StyledInput
                  type="number" required min="0" step="0.01"
                  placeholder="25.00"
                  value={form.price} onChange={e => set('price', e.target.value)}
                />
              </Field>
              <Field label="Condition *">
                <StyledSelect value={form.condition} onChange={e => set('condition', e.target.value)}>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </StyledSelect>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Author">
                <StyledInput
                  type="text" placeholder="e.g. Thomas H. Cormen"
                  value={form.author} onChange={e => set('author', e.target.value)}
                />
              </Field>
              <Field label="Edition">
                <StyledInput
                  type="text" placeholder="e.g. 3rd Edition"
                  value={form.edition} onChange={e => set('edition', e.target.value)}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Course Code">
                <StyledInput
                  type="text" placeholder="e.g. 159.333"
                  value={form.course} onChange={e => set('course', e.target.value)}
                />
              </Field>
              <Field label="Subject">
                <StyledInput
                  type="text" placeholder="e.g. Computer Science"
                  value={form.subject} onChange={e => set('subject', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Book Images" hint="Upload up to 5 photos (JPG, PNG, WEBP — max 5MB each)">
              {/* File input trigger */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px', border: '1.5px dashed #D6D3D1',
                borderRadius: 12, cursor: 'pointer', backgroundColor: '#FAFAF8',
                fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D6A4F'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#D6D3D1'}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {imageFiles.length > 0 ? `${imageFiles.length} file(s) selected` : 'Click to upload images'}
                <input
                  type="file" multiple accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Previews */}
              {previews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: 88, height: 88 }}>
                      <img src={src} alt={`preview ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover',
                          borderRadius: 10, border: '1px solid #E7E5E4' }} />
                      <button
                        type="button" onClick={() => removeImage(i)}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          width: 22, height: 22, borderRadius: '50%',
                          backgroundColor: '#DC2626', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1, padding: '13px',
                  backgroundColor: loading ? '#A8A29E' : '#2D6A4F',
                  color: '#FAFAF8', border: 'none', borderRadius: 14,
                  fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(45,106,79,0.2)',
                  transition: 'background-color 0.2s, transform 0.1s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#52B788' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#2D6A4F' }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {loading ? 'Publishing...' : 'Publish Listing'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  padding: '13px 24px', background: '#fff',
                  border: '1.5px solid #E7E5E4', borderRadius: 14,
                  fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 500,
                  color: '#57534E', cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F5F4'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}