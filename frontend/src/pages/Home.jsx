import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

const conditionBadge = {
  'New':      { bg: '#D1FAE5', color: '#065F46' },
  'Like New': { bg: '#DBEAFE', color: '#1E40AF' },
  'Good':     { bg: '#FEF9C3', color: '#854D0E' },
  'Fair':     { bg: '#FFEDD5', color: '#9A3412' },
}

/* ─── Book Card ─── */
function BookCard({ listing }) {
  const [hovered, setHovered] = useState(false)
  const badge = conditionBadge[listing.condition] || { bg: '#F5F5F4', color: '#57534E' }

  return (
    <Link
      to={`/listings/${listing._id}`}
      className="stagger-item"
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: '#fff', borderRadius: 20,
        border: hovered ? '1px solid #52B788' : '1px solid #E7E5E4',
        boxShadow: hovered ? '0 12px 32px rgba(45,106,79,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s ease', overflow: 'hidden', cursor: 'pointer',
      }}>
        {/* Cover image */}
        <div style={{ position: 'relative', aspectRatio: '3/4', background: '#F5F5F4', overflow: 'hidden' }}>
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]} alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.5s ease' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, color: '#A8A29E' }}>
              <svg width="52" height="52" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span style={{ fontSize: 12, fontFamily: "'Inter', sans-serif" }}>No image</span>
            </div>
          )}
          {/* Condition badge */}
          <span style={{
            position: 'absolute', top: 10, left: 10, padding: '3px 10px',
            borderRadius: 999, fontSize: 11, fontWeight: 600,
            fontFamily: "'Inter', sans-serif", backgroundColor: badge.bg, color: badge.color,
          }}>
            {listing.condition}
          </span>
          {/* Sold overlay */}
          {listing.status === 'sold' && !hovered && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(28,25,23,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ backgroundColor: '#1C1917', color: '#FAFAF8',
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12,
                padding: '5px 16px', borderRadius: 999, letterSpacing: '0.1em' }}>
                SOLD
              </span>
            </div>
          )}
          {/* Hover overlay */}
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(28,25,23,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.25s ease',
          }}>
            <span style={{
              backgroundColor: '#D4A853', color: '#1C1917', fontFamily: "'Inter', sans-serif",
              fontWeight: 700, fontSize: 13, padding: '9px 20px', borderRadius: 999,
              transform: hovered ? 'scale(1)' : 'scale(0.9)', transition: 'transform 0.2s ease',
            }}>
              View Details
            </span>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <h3 style={{
              fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 14,
              color: '#1C1917', lineHeight: 1.4, flex: 1,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0,
            }}>
              {listing.title}
            </h3>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16,
              color: '#D4A853', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              ${listing.price}
            </span>
          </div>
          {listing.course && (
            <span style={{
              display: 'inline-block', fontSize: 11, padding: '2px 9px',
              borderRadius: 999, backgroundColor: '#F3F2EF', color: '#57534E',
              fontFamily: "'Inter', sans-serif", fontWeight: 500, marginBottom: 8,
            }}>
              {listing.course}
            </span>
          )}
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#A8A29E',
            display: 'flex', alignItems: 'center', gap: 4, margin: 0,
          }}>
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {listing.seller?.username}
          </p>
        </div>
      </div>
    </Link>
  )
}

/* ─── Skeleton ─── */
function BookCardSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4', overflow: 'hidden' }}>
      <div style={{ aspectRatio: '3/4', background: '#F5F5F4', animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ height: 14, background: '#F5F5F4', borderRadius: 8, width: '75%', marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ height: 12, background: '#F5F5F4', borderRadius: 8, width: '45%', animation: 'pulse 1.5s ease infinite' }} />
      </div>
    </div>
  )
}

/* ─── FilterSelect ─── */
function FilterSelect({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
        color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: '#F5F5F4', border: '1px solid #E7E5E4', borderRadius: 10,
          padding: '8px 12px', fontSize: 14, fontFamily: "'Inter', sans-serif",
          color: '#1C1917', outline: 'none', cursor: 'pointer',
        }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

/* ─── AI Picks Section ─── */
function AIPicks() {
  const [state, setState] = useState('loading') // 'loading' | 'empty' | 'no-interests' | 'done'
  const [picks, setPicks] = useState([])

  useEffect(() => {
    api.get('/recommendations')
      .then(({ data }) => {
        if (data.empty) { setState('no-interests'); return }
        if (!data.recommendations?.length) { setState('empty'); return }
        setPicks(data.recommendations)
        setState('done')
      })
      .catch(() => setState('empty'))
  }, [])

  if (state === 'loading') return (
    <div style={{ padding: '32px 24px 0' }}>
      <SectionHeader />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {[...Array(5)].map((_, i) => <BookCardSkeleton key={i} />)}
      </div>
    </div>
  )

  if (state === 'no-interests') return (
    <div style={{ padding: '32px 24px 0' }}>
      <SectionHeader />
      <div style={{ background: 'linear-gradient(135deg, #F0FAF4, #E8F5F0)', borderRadius: 20,
        border: '1.5px dashed #B7DFC9', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
        <p style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 16, color: '#1C1917', marginBottom: 6 }}>
          Set your interests for personalised picks
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#57534E', marginBottom: 16 }}>
          Add your courses and subjects in your profile — our AI will recommend the most relevant books.
        </p>
        <Link to="/profile"
          style={{ display: 'inline-block', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
            backgroundColor: '#2D6A4F', color: '#FAFAF8', padding: '9px 22px',
            borderRadius: 12, textDecoration: 'none' }}>
          Update Profile
        </Link>
      </div>
    </div>
  )

  if (state === 'empty') return (
    <div style={{ padding: '32px 24px 0' }}>
      <SectionHeader />
      <div style={{ background: '#F5F5F4', borderRadius: 20, padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#A8A29E', margin: 0 }}>
          No listings available for recommendations yet. Check back once more books are listed.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px 24px 0' }}>
      <SectionHeader />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {picks.map(({ listing, reason }) => (
          <AIPickCard key={listing._id} listing={listing} reason={reason} />
        ))}
      </div>
    </div>
  )
}

function SectionHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <h2 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: '#1C1917', margin: 0 }}>
        AI Picks for You
      </h2>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
        backgroundColor: '#D1FAE5', color: '#065F46',
        fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em' }}>
        ✨ Powered by Gemini
      </span>
    </div>
  )
}

function AIPickCard({ listing, reason }) {
  const [hovered, setHovered] = useState(false)
  const badge = conditionBadge[listing.condition] || { bg: '#F5F5F4', color: '#57534E' }

  return (
    <Link to={`/listings/${listing._id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={{
        background: '#fff', borderRadius: 20,
        border: hovered ? '1.5px solid #52B788' : '1.5px solid #B7DFC9',
        boxShadow: hovered ? '0 12px 32px rgba(45,106,79,0.14)' : '0 2px 8px rgba(45,106,79,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s ease', overflow: 'hidden', cursor: 'pointer',
      }}>
        <div style={{ position: 'relative', aspectRatio: '3/4', background: '#F5F5F4', overflow: 'hidden' }}>
          {listing.images?.[0] ? (
            <img src={listing.images[0]} alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.5s ease' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, color: '#A8A29E' }}>
              <svg width="52" height="52" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span style={{ fontSize: 12, fontFamily: "'Inter', sans-serif" }}>No image</span>
            </div>
          )}
          <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 10px',
            borderRadius: 999, fontSize: 11, fontWeight: 600,
            fontFamily: "'Inter', sans-serif", backgroundColor: badge.bg, color: badge.color }}>
            {listing.condition}
          </span>
          <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px',
            borderRadius: 999, fontSize: 10, fontWeight: 700,
            fontFamily: "'Inter', sans-serif", backgroundColor: '#D1FAE5', color: '#065F46' }}>
            ✨ AI
          </span>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 14,
              color: '#1C1917', lineHeight: 1.4, flex: 1,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
              {listing.title}
            </h3>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16,
              color: '#D4A853', whiteSpace: 'nowrap', flexShrink: 0 }}>
              ${listing.price}
            </span>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#52B788',
            fontStyle: 'italic', margin: '0 0 6px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {reason}
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#A8A29E',
            display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {listing.seller?.username}
          </p>
        </div>
      </div>
    </Link>
  )
}

/* ─── Home Page ─── */
export default function Home() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ course: '', subject: '', condition: '', minPrice: '', maxPrice: '', sellerName: '' })
  const [tab, setTab] = useState('available')

  const fetchListings = async (q = query, f = filters, t = tab) => {
    setLoading(true)
    try {
      const params = {}
      if (t === 'sold') params.status = 'sold'
      if (q) params.keyword = q
      if (f.course) params.course = f.course
      if (f.subject) params.subject = f.subject
      if (f.condition) params.condition = f.condition
      if (f.minPrice) params.minPrice = f.minPrice
      if (f.maxPrice) params.maxPrice = f.maxPrice
      if (f.sellerName) params.sellerName = f.sellerName
      const { data } = await api.get('/listings', { params })
      // available 返回数组，sold 返回 { data: [] }
      setListings(Array.isArray(data) ? data : (data.data || []))
    } catch { setListings([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchListings(query, filters, tab) }, [tab])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchListings(query, filters, tab)
  }

  const handleReset = () => {
    const empty = { course: '', subject: '', condition: '', minPrice: '', maxPrice: '', sellerName: '' }
    setQuery('')
    setFilters(empty)
    fetchListings('', empty, tab)
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8' }}>

      {/* ── Hero ── */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, #1C1917 0%, #2D6A4F 60%, #52B788 100%)',
        padding: '72px 24px 80px',
        textAlign: 'center',
      }}>
        <span style={{
          display: 'inline-block', background: 'rgba(212,168,83,0.2)',
          border: '1px solid rgba(212,168,83,0.4)', color: '#D4A853',
          fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
          padding: '5px 16px', borderRadius: 999, marginBottom: 20,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          🎓 Student Book Marketplace
        </span>
        <h1 style={{
          fontFamily: "'Lora', serif", fontWeight: 600,
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
          color: '#FAFAF8', margin: '0 0 16px', lineHeight: 1.15,
        }}>
          Find Your Next Textbook
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'rgba(250,250,248,0.75)',
          maxWidth: 480, margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          Buy, sell, or exchange textbooks directly with fellow students — save money every semester.
        </p>

        {/* Hero search bar */}
        <form onSubmit={handleSearch} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: 0, background: '#fff',
            borderRadius: 16, padding: 6,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: 14, gap: 10 }}>
              <svg width="18" height="18" fill="none" stroke="#A8A29E" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by title, author or keyword..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontFamily: "'Inter', sans-serif", fontSize: 15,
                  color: '#1C1917', background: 'transparent',
                  padding: '10px 0',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                backgroundColor: '#2D6A4F', color: '#FAFAF8',
                border: 'none', borderRadius: 12, padding: '10px 24px',
                fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#52B788'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D6A4F'}
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* ── Filter Card ── */}
      <div style={{ padding: '0 24px' }}>
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #E7E5E4',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          marginTop: -32, position: 'relative', zIndex: 10,
          overflow: 'hidden',
        }}>
          {/* Filter toggle header */}
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" fill="none" stroke="#57534E" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>
                Filters
              </span>
              {hasActiveFilters && (
                <span style={{
                  backgroundColor: '#2D6A4F', color: '#fff',
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                }}>
                  Active
                </span>
              )}
            </div>
            <svg
              width="16" height="16" fill="none" stroke="#A8A29E" viewBox="0 0 24 24"
              style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible filter body */}
          <div style={{
            maxHeight: showFilters ? 300 : 0,
            opacity: showFilters ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.3s ease',
          }}>
            <div style={{
              padding: '4px 24px 20px',
              borderTop: '1px solid #F5F5F4',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
            }}>
              <FilterField label="Course" placeholder="e.g. CS101"
                value={filters.course} onChange={v => setFilters(f => ({ ...f, course: v }))} />
              <FilterField label="Subject" placeholder="e.g. Mathematics"
                value={filters.subject} onChange={v => setFilters(f => ({ ...f, subject: v }))} />
              <FilterField label="Seller" placeholder="e.g. john_doe"
                value={filters.sellerName} onChange={v => setFilters(f => ({ ...f, sellerName: v }))} />
              <FilterSelect label="Condition" options={CONDITIONS}
                value={filters.condition} onChange={v => setFilters(f => ({ ...f, condition: v }))} />
              <div>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
                  color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Price Range
                </label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" min="0" placeholder="Min" value={filters.minPrice}
                    onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                    style={filterInputStyle} />
                  <span style={{ color: '#D6D3D1', fontSize: 16 }}>–</span>
                  <input type="number" min="0" placeholder="Max" value={filters.maxPrice}
                    onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                    style={filterInputStyle} />
                </div>
              </div>
            </div>
            <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={handleReset}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                  color: '#A8A29E', background: 'none', border: 'none', cursor: 'pointer' }}>
                ↺ Reset
              </button>
              <button onClick={() => { fetchListings(); setShowFilters(false) }}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                  color: '#FAFAF8', backgroundColor: '#2D6A4F', border: 'none',
                  borderRadius: 10, padding: '8px 20px', cursor: 'pointer' }}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Picks (logged-in users only) ── */}
      {user && <AIPicks />}

      {/* ── Listings ── */}
      <div style={{ padding: '32px 24px 64px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Tab toggle */}
            <div style={{ display: 'flex', background: '#F5F5F4', borderRadius: 12, padding: 4, gap: 2 }}>
              {[
                { key: 'available', label: 'For Sale' },
                { key: 'sold',      label: 'Sold'     },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  padding: '7px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                  transition: 'all 0.2s',
                  backgroundColor: tab === key ? (key === 'sold' ? '#1C1917' : '#2D6A4F') : 'transparent',
                  color: tab === key ? '#FAFAF8' : '#57534E',
                }}>
                  {label}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E', margin: 0 }}>
              {loading ? 'Loading...' : (
                <>
                  <strong style={{ color: '#1C1917' }}>{listings.length}</strong>
                  {' '}{tab === 'sold' ? 'sold' : (listings.length === 1 ? 'book' : 'books available')}
                </>
              )}
            </p>
          </div>
          <Link
            to={user ? '/listings/create' : '/register'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
              backgroundColor: '#2D6A4F', color: '#FAFAF8',
              padding: '9px 20px', borderRadius: 12, textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#52B788'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D6A4F'}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            List a Book
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {[...Array(8)].map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: '#fff', borderRadius: 24, border: '1px solid #E7E5E4',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <p style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 18, color: '#1C1917', marginBottom: 8 }}>
              No books found
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#A8A29E', marginBottom: 20 }}>
              Try adjusting your search or filters.
            </p>
            <button
              onClick={handleReset}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                color: '#2D6A4F', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {listings.map(listing => <BookCard key={listing._id} listing={listing} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1C1917', color: 'rgba(250,250,248,0.5)',
        textAlign: 'center', padding: '32px 24px',
        fontFamily: "'Inter', sans-serif", fontSize: 13,
      }}>
        © 2025 BookSwap — Built with ❤️ by Team Group 1
      </footer>
    </div>
  )
}

function FilterField({ label, placeholder, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
        color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        type="text" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        style={filterInputStyle}
      />
    </div>
  )
}

const filterInputStyle = {
  background: '#F5F5F4', border: '1px solid #E7E5E4', borderRadius: 10,
  padding: '8px 12px', fontSize: 14, fontFamily: "'Inter', sans-serif",
  color: '#1C1917', outline: 'none', width: '100%',
}