import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { recordView } from '../utils/history'

const conditionBadge = {
  'New':      { bg: '#D1FAE5', color: '#065F46' },
  'Like New': { bg: '#DBEAFE', color: '#1E40AF' },
  'Good':     { bg: '#FEF9C3', color: '#854D0E' },
  'Fair':     { bg: '#FFEDD5', color: '#9A3412' },
}

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)
  const [msgFocused, setMsgFocused] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(({ data }) => { setListing(data); recordView(data) })
      .catch(() => toast.error('Listing not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!user) return navigate('/login')
    if (!message.trim()) return
    setSendingMsg(true)
    try {
      await api.post('/messages', {
        receiverId: listing.seller._id,
        listingId: listing._id,
        content: message.trim()
      })
      toast.success('Message sent!')
      setMessage('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSendingMsg(false)
    }
  }

  const handleBuy = async () => {
    if (!user) return navigate('/login')
    setBuyLoading(true)
    try {
      await api.post('/transactions', { listingId: listing._id, type: 'sale' })
      toast.success('Purchase request sent! The seller will confirm shortly.')
      navigate('/transactions')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate transaction')
    } finally {
      setBuyLoading(false)
    }
  }

  const handleReport = async (e) => {
    e.preventDefault()
    if (!reportReason.trim()) return toast.error('Please enter a reason')
    setReportLoading(true)
    try {
      await api.post('/reports', {
        listingId: listing._id,
        reportedUserId: listing.seller._id,
        reason: reportReason.trim()
      })
      toast.success('Report submitted. Our team will review it shortly.')
      setShowReport(false)
      setReportReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setReportLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    try {
      await api.delete(`/listings/${id}`)
      toast.success('Listing deleted')
      navigate('/')
    } catch {
      toast.error('Failed to delete listing')
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40, animation: 'pulse 1.5s ease infinite' }}>
          <div style={{ aspectRatio: '1/1', background: '#E7E5E4', borderRadius: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            <div style={{ height: 32, background: '#E7E5E4', borderRadius: 10, width: '70%' }} />
            <div style={{ height: 24, background: '#E7E5E4', borderRadius: 10, width: '30%' }} />
            <div style={{ height: 80, background: '#E7E5E4', borderRadius: 10 }} />
          </div>
        </div>
      </div>
    </div>
  )

  if (!listing) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span style={{ fontSize: 48 }}>😕</span>
      <p style={{ fontFamily: "'Lora', serif", fontSize: 20, color: '#1C1917' }}>Listing not found</p>
      <Link to="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14,
        color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
        ← Browse all books
      </Link>
    </div>
  )

  const isOwner = user && listing.seller._id === user.id
  const isAvailable = listing.status === 'available'
  const badge = conditionBadge[listing.condition] || { bg: '#F5F5F4', color: '#57534E' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E',
          textDecoration: 'none', marginBottom: 28 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 40,
          '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } }}>

          {/* Image */}
          <div style={{ background: '#F5F5F4', borderRadius: 24, overflow: 'hidden',
            border: '1px solid #E7E5E4', aspectRatio: '1/1',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {listing.images?.[0] ? (
              <img src={listing.images[0]} alt={listing.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#A8A29E' }}>
                <svg width="72" height="72" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, marginTop: 8 }}>No image</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Title & Price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: 12, marginBottom: 14 }}>
              <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 600,
                color: '#1C1917', lineHeight: 1.3, margin: 0, flex: 1 }}>
                {listing.title}
              </h1>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 28, fontWeight: 700,
                color: '#D4A853', whiteSpace: 'nowrap', flexShrink: 0 }}>
                ${listing.price}
              </span>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                fontFamily: "'Inter', sans-serif", backgroundColor: badge.bg, color: badge.color }}>
                {listing.condition}
              </span>
              {listing.status !== 'available' && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                  fontFamily: "'Inter', sans-serif", backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                  {listing.status}
                </span>
              )}
              {listing.course && (
                <span style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 999,
                  fontFamily: "'Inter', sans-serif", backgroundColor: '#F3F2EF', color: '#57534E' }}>
                  {listing.course}
                </span>
              )}
              {listing.subject && (
                <span style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 999,
                  fontFamily: "'Inter', sans-serif", backgroundColor: '#F3F2EF', color: '#57534E' }}>
                  {listing.subject}
                </span>
              )}
            </div>

            {/* Description */}
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#57534E',
              lineHeight: 1.7, marginBottom: 24 }}>
              {listing.description}
            </p>

            {/* Seller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              backgroundColor: '#F5F5F4', borderRadius: 14, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, backgroundColor: '#2D6A4F', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FAFAF8', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16 }}>
                {listing.seller.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                  color: '#1C1917', margin: 0 }}>{listing.seller.username}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
                  color: '#A8A29E', margin: 0 }}>Seller</p>
              </div>
            </div>

            {/* Actions */}
            {isOwner ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: '12px 16px', backgroundColor: '#F5F5F4', borderRadius: 12 }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E', margin: 0 }}>
                    This is your listing.
                  </p>
                </div>
                <button onClick={handleDelete} style={{
                  padding: '12px', border: '1.5px solid #FECACA', borderRadius: 14,
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                  color: '#DC2626', background: '#fff', cursor: 'pointer', transition: 'background-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  Delete Listing
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {isAvailable && (
                  <button onClick={handleBuy} disabled={buyLoading} style={{
                    padding: '13px', backgroundColor: buyLoading ? '#A8A29E' : '#2D6A4F',
                    color: '#FAFAF8', border: 'none', borderRadius: 14,
                    fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
                    cursor: buyLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(45,106,79,0.25)', transition: 'background-color 0.2s',
                  }}
                    onMouseEnter={e => { if (!buyLoading) e.currentTarget.style.backgroundColor = '#52B788' }}
                    onMouseLeave={e => { if (!buyLoading) e.currentTarget.style.backgroundColor = '#2D6A4F' }}
                  >
                    {buyLoading ? 'Processing...' : '💰 Buy Now'}
                  </button>
                )}

                {user && isAvailable && (
                  <>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text" value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Ask the seller a question..."
                        onFocus={() => setMsgFocused(true)}
                        onBlur={() => setMsgFocused(false)}
                        style={{
                          flex: 1, padding: '11px 14px',
                          border: `1.5px solid ${msgFocused ? '#2D6A4F' : '#E7E5E4'}`,
                          borderRadius: 12, fontFamily: "'Inter', sans-serif",
                          fontSize: 14, color: '#1C1917', outline: 'none', background: '#fff',
                          boxShadow: msgFocused ? '0 0 0 3px rgba(45,106,79,0.1)' : 'none',
                        }}
                      />
                      <button type="submit" disabled={sendingMsg} style={{
                        padding: '11px 18px', backgroundColor: '#1C1917', color: '#FAFAF8',
                        border: 'none', borderRadius: 12, fontFamily: "'Inter', sans-serif",
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                        transition: 'background-color 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2D6A4F'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1C1917'}
                      >
                        Send
                      </button>
                    </form>
                    <Link to={`/messages/${listing._id}?with=${listing.seller._id}`}
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#2D6A4F',
                        fontWeight: 500, textDecoration: 'none', textAlign: 'center' }}>
                      View full conversation →
                    </Link>
                  </>
                )}

                {!user && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E',
                    textAlign: 'center', padding: '16px', background: '#F5F5F4', borderRadius: 12 }}>
                    <Link to="/login" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
                      Sign in
                    </Link>{' '}
                    to buy or message the seller
                  </p>
                )}

                {/* Report button */}
                {user && (
                  <button
                    onClick={() => setShowReport(true)}
                    style={{
                      marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#A8A29E',
                      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                    onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H13l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    Report this listing
                  </button>
                )}
              </div>
            )}

            {/* ── Report Modal ── */}
            {showReport && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              }}>
                {/* Backdrop */}
                <div
                  onClick={() => setShowReport(false)}
                  style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(4px)' }}
                />
                {/* Modal card */}
                <div style={{
                  position: 'relative', background: '#fff', borderRadius: 20,
                  boxShadow: '0 24px 64px rgba(0,0,0,0.18)', width: '100%', maxWidth: 440, padding: 28,
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: '#1C1917', margin: 0 }}>
                        Report Listing
                      </h3>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#A8A29E', margin: '4px 0 0' }}>
                        Our team will review your report
                      </p>
                    </div>
                    <button onClick={() => setShowReport(false)} style={{
                      background: '#F5F5F4', border: 'none', borderRadius: 8,
                      width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#57534E',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                  </div>

                  {/* Listing preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: '#F5F5F4', borderRadius: 12, marginBottom: 20 }}>
                    <svg width="18" height="18" fill="none" stroke="#A8A29E" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: '#1C1917' }}>
                      {listing.title}
                    </span>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleReport}>
                    <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 13,
                      fontWeight: 700, color: '#1C1917', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Reason for reporting
                    </label>
                    <textarea
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      placeholder="Describe the issue (e.g. misleading description, inappropriate content, scam...)"
                      rows={4}
                      style={{
                        width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                        border: '1.5px solid #E7E5E4', borderRadius: 12, resize: 'none',
                        fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#1C1917',
                        outline: 'none', lineHeight: 1.6,
                      }}
                      onFocus={e => e.target.style.borderColor = '#DC2626'}
                      onBlur={e => e.target.style.borderColor = '#E7E5E4'}
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button type="button" onClick={() => setShowReport(false)} style={{
                        flex: 1, padding: '11px', border: '1.5px solid #E7E5E4', borderRadius: 12,
                        fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
                        color: '#57534E', background: '#fff', cursor: 'pointer',
                      }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={reportLoading} style={{
                        flex: 1, padding: '11px', border: 'none', borderRadius: 12,
                        fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                        color: '#fff', backgroundColor: reportLoading ? '#A8A29E' : '#DC2626',
                        cursor: reportLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s',
                      }}
                        onMouseEnter={e => { if (!reportLoading) e.currentTarget.style.backgroundColor = '#B91C1C' }}
                        onMouseLeave={e => { if (!reportLoading) e.currentTarget.style.backgroundColor = '#DC2626' }}
                      >
                        {reportLoading ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}