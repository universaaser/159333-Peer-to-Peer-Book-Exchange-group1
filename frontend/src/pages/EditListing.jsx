import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

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
        fontSize: 14, fontWeight: 600, color: '#1C1917', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
        color: '#A8A29E', marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

function StyledInput({ value, onChange, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input value={value} onChange={onChange} {...props}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle,
        borderColor: focused ? '#2D6A4F' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none' }} />
  )
}

function StyledTextarea({ value, onChange, rows = 4, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea value={value} onChange={onChange} rows={rows} {...props}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle, resize: 'none',
        borderColor: focused ? '#2D6A4F' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none' }} />
  )
}

function StyledSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <select value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle, cursor: 'pointer',
        borderColor: focused ? '#2D6A4F' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none' }}>
      {children}
    </select>
  )
}

export default function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    condition: 'Good', course: '', subject: '',
  })
  const [existingImages, setExistingImages] = useState([]) // already-saved URLs
  const [newFiles, setNewFiles]     = useState([])         // File objects to upload
  const [newPreviews, setNewPreviews] = useState([])       // base64 for new files

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(({ data }) => {
        setForm({
          title:       data.title       || '',
          description: data.description || '',
          price:       data.price       ?? '',
          condition:   data.condition   || 'Good',
          course:      data.course      || '',
          subject:     data.subject     || '',
        })
        setExistingImages(data.images || [])
      })
      .catch(() => toast.error('Failed to load listing'))
      .finally(() => setPageLoading(false))
  }, [id])

  const removeExisting = (index) =>
    setExistingImages(imgs => imgs.filter((_, i) => i !== index))

  const handleNewFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - existingImages.length)
    setNewFiles(files)
    Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = ev => resolve(ev.target.result)
      reader.readAsDataURL(file)
    }))).then(setNewPreviews)
  }

  const removeNew = (index) => {
    setNewFiles(f => f.filter((_, i) => i !== index))
    setNewPreviews(p => p.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let uploadedUrls = []
      if (newFiles.length > 0) {
        const formData = new FormData()
        newFiles.forEach(f => formData.append('images', f))
        const { data: uploadData } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedUrls = uploadData.urls
      }

      await api.put(`/listings/${id}`, {
        ...form,
        price: Number(form.price),
        images: [...existingImages, ...uploadedUrls],
      })
      toast.success('Listing updated!')
      navigate(`/listings/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update listing')
    } finally {
      setSaving(false)
    }
  }

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: "'Inter', sans-serif", color: '#A8A29E' }}>Loading…</p>
    </div>
  )

  const totalImages = existingImages.length + newFiles.length
  const canAddMore = totalImages < 5

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <Link to={`/listings/${id}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E',
            textDecoration: 'none', marginBottom: 28 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listing
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 32, fontWeight: 600,
            color: '#1C1917', margin: '0 0 8px' }}>
            Edit Listing
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#57534E', margin: 0 }}>
            Update the details for your book listing.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #E7E5E4',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)', padding: '36px 32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <Field label="Book Title *">
              <StyledInput type="text" required
                placeholder="e.g. Introduction to Algorithms"
                value={form.title} onChange={e => set('title', e.target.value)} />
            </Field>

            <Field label="Description *">
              <StyledTextarea required rows={4}
                placeholder="Describe the book — edition, any marks, highlights, etc."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Price (NZD) *">
                <StyledInput type="number" required min="0" step="0.01"
                  placeholder="25.00"
                  value={form.price} onChange={e => set('price', e.target.value)} />
              </Field>
              <Field label="Condition *">
                <StyledSelect value={form.condition} onChange={e => set('condition', e.target.value)}>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </StyledSelect>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Course Code">
                <StyledInput type="text" placeholder="e.g. 159.333"
                  value={form.course} onChange={e => set('course', e.target.value)} />
              </Field>
              <Field label="Subject">
                <StyledInput type="text" placeholder="e.g. Computer Science"
                  value={form.subject} onChange={e => set('subject', e.target.value)} />
              </Field>
            </div>

            {/* Images */}
            <Field label="Book Images"
              hint={`${totalImages}/5 images. Remove existing ones or add new photos.`}>

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  {existingImages.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: 88, height: 88 }}>
                      <img src={src} alt={`image ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover',
                          borderRadius: 10, border: '2px solid #2D6A4F' }} />
                      <button type="button" onClick={() => removeExisting(i)}
                        style={{ position: 'absolute', top: -6, right: -6,
                          width: 22, height: 22, borderRadius: '50%',
                          backgroundColor: '#DC2626', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New file previews */}
              {newPreviews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  {newPreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: 88, height: 88 }}>
                      <img src={src} alt={`new ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover',
                          borderRadius: 10, border: '1px solid #E7E5E4' }} />
                      <button type="button" onClick={() => removeNew(i)}
                        style={{ position: 'absolute', top: -6, right: -6,
                          width: 22, height: 22, borderRadius: '50%',
                          backgroundColor: '#DC2626', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload trigger */}
              {canAddMore && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px', border: '1.5px dashed #D6D3D1',
                  borderRadius: 12, cursor: 'pointer', backgroundColor: '#FAFAF8',
                  fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E',
                  transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2D6A4F'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#D6D3D1'}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {newFiles.length > 0
                    ? `${newFiles.length} new file(s) selected`
                    : `Add photos (up to ${5 - existingImages.length} more)`}
                  <input type="file" multiple accept="image/*"
                    onChange={handleNewFiles} style={{ display: 'none' }} />
                </label>
              )}
            </Field>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
              <button type="submit" disabled={saving}
                style={{ flex: 1, padding: '13px',
                  backgroundColor: saving ? '#A8A29E' : '#2D6A4F',
                  color: '#FAFAF8', border: 'none', borderRadius: 14,
                  fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(45,106,79,0.2)', transition: 'background-color 0.2s' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#52B788' }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#2D6A4F' }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => navigate(`/listings/${id}`)}
                style={{ padding: '13px 24px', background: '#fff',
                  border: '1.5px solid #E7E5E4', borderRadius: 14,
                  fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 500,
                  color: '#57534E', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F5F4'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
