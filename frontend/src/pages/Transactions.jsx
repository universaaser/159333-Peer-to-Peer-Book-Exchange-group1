import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const statusConfig = {
  pending:   { bg: '#FEF9C3', color: '#854D0E', label: 'Pending' },
  confirmed: { bg: '#DBEAFE', color: '#1E40AF', label: 'Confirmed' },
  completed: { bg: '#D1FAE5', color: '#065F46', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
}

function TransactionSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
      padding: '20px', display: 'flex', gap: 14 }}>
      <div style={{ width: 56, height: 56, background: '#F5F5F4', borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 14, background: '#F5F5F4', borderRadius: 8, width: '55%' }} />
        <div style={{ height: 12, background: '#F5F5F4', borderRadius: 8, width: '35%' }} />
        <div style={{ height: 26, background: '#F5F5F4', borderRadius: 8, width: '20%' }} />
      </div>
    </div>
  )
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24"
              fill={filled ? '#D4A853' : 'none'}
              stroke={filled ? '#D4A853' : '#D1D5DB'}
              strokeWidth="1.5"
              style={{ transition: 'fill 0.1s, stroke 0.1s' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

function TransactionCard({ transaction: t, role, onUpdate, onReview, isReviewed }) {
  const isSeller = role === 'seller'
  const s = statusConfig[t.status] || statusConfig.pending
  const navigate = useNavigate()

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
      padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start',
      transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#D6D3D1'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#E7E5E4'}
    >
      {/* Book thumbnail */}
      <div style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#F5F5F4',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, border: '1px solid #E7E5E4' }}>
        {t.listing?.images?.[0] ? (
          <img src={t.listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 24 }}>📖</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 8, marginBottom: 4 }}>
          <Link to={`/listings/${t.listing._id}`}
            style={{ fontFamily: "'Lora', serif", fontSize: 15, fontWeight: 600,
              color: '#1C1917', textDecoration: 'none', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
            onMouseEnter={e => e.currentTarget.style.color = '#2D6A4F'}
            onMouseLeave={e => e.currentTarget.style.color = '#1C1917'}
          >
            {t.listing.title}
          </Link>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700,
            color: '#D4A853', whiteSpace: 'nowrap', flexShrink: 0 }}>
            ${t.price}
          </span>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#A8A29E', margin: '0 0 12px' }}>
          {isSeller ? `Buyer: ${t.buyer.username}` : `Seller: ${t.seller.username}`}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
            fontFamily: "'Inter', sans-serif", backgroundColor: s.bg, color: s.color }}>
            {s.label}
          </span>

          {/* Seller actions */}
          {isSeller && t.status === 'pending' && (
            <>
              <ActionBtn label="Accept" onClick={() => onUpdate(t._id, 'confirmed')}
                bg="#2D6A4F" hover="#52B788" />
              <ActionBtn label="Decline" onClick={() => onUpdate(t._id, 'cancelled')}
                bg="#fff" color="#DC2626" border="#FECACA" hover="#FEF2F2" />
            </>
          )}

          {/* Buyer actions */}
          {!isSeller && t.status === 'pending' && (
            <ActionBtn label="Cancel Request" onClick={() => onUpdate(t._id, 'cancelled')}
              bg="#fff" color="#DC2626" border="#FECACA" hover="#FEF2F2" />
          )}
          {!isSeller && t.status === 'confirmed' && (
            <ActionBtn label="💳 Pay Now" onClick={() => navigate(`/payment/${t._id}`)}
              bg="#D4A853" color="#1C1917" hover="#C9963E" />
          )}

          {/* Leave a review — only buyers can review after completion */}
          {t.status === 'completed' && !isSeller && (
            isReviewed ? (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                color: '#2D6A4F', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Reviewed
              </span>
            ) : (
              <ActionBtn label="Leave a Review" onClick={() => onReview(t, role)}
                bg="#fff" color="#2D6A4F" border="#B7DFC9" hover="#F0FAF4" />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ label, onClick, bg, color = '#FAFAF8', border, hover }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 14px', fontSize: 12, fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        backgroundColor: hovered ? hover : bg,
        color, border: border ? `1.5px solid ${border}` : 'none',
        borderRadius: 10, cursor: 'pointer', transition: 'background-color 0.15s',
      }}>
      {label}
    </button>
  )
}

function Section({ title, items, emptyMsg, emptyLink, emptyLinkLabel, role, onUpdate, onReview, reviewedIds }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600,
        color: '#1C1917', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        {title}
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
          backgroundColor: '#F3F2EF', color: '#57534E', padding: '2px 10px', borderRadius: 999 }}>
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <div style={{ padding: '28px 24px', background: '#fff', borderRadius: 16,
          border: '1px solid #E7E5E4', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#A8A29E', margin: '0 0 8px' }}>
            {emptyMsg}
          </p>
          <Link to={emptyLink} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14,
            color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
            {emptyLinkLabel} →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(t => (
            <TransactionCard
              key={t._id}
              transaction={t}
              role={role}
              onUpdate={onUpdate}
              onReview={onReview}
              isReviewed={reviewedIds.has(t._id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const [reviewModal, setReviewModal] = useState(null) // { transaction, role }
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const fetchTransactions = () => {
    api.get('/transactions/my')
      .then(({ data }) => setTransactions(data))
  }

  useEffect(() => {
    Promise.all([
      api.get('/transactions/my'),
      api.get('/reviews/my'),
    ]).then(([txRes, reviewRes]) => {
      setTransactions(txRes.data)
      const ids = new Set(reviewRes.data.map(r => r.transaction).filter(Boolean))
      setReviewedIds(ids)
    }).finally(() => setLoading(false))
  }, [])

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/transactions/${id}/status`, { status })
      toast.success(`Transaction ${status}`)
      fetchTransactions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  const openReview = (transaction, role) => {
    setReviewModal({ transaction, role })
    setReviewRating(0)
    setReviewComment('')
  }

  const closeReview = () => {
    setReviewModal(null)
    setReviewRating(0)
    setReviewComment('')
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (reviewRating === 0) return toast.error('Please select a star rating')
    const { transaction: t, role } = reviewModal
    const isSeller = role === 'seller'
    setReviewLoading(true)
    try {
      await api.post('/reviews', {
        revieweeId: isSeller ? t.buyer._id : t.seller._id,
        listingId: t.listing._id,
        transactionId: t._id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        type: isSeller ? 'buyer' : 'seller',
      })
      toast.success('Review submitted!')
      setReviewedIds(prev => new Set([...prev, t._id]))
      closeReview()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setReviewLoading(false)
    }
  }

  const buying  = transactions.filter(t => t.buyer._id  === user.id)
  const selling = transactions.filter(t => t.seller._id === user.id)

  const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 30, fontWeight: 600,
          color: '#1C1917', marginBottom: 8 }}>
          My Transactions
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#57534E', marginBottom: 40 }}>
          Track your purchases and sales.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => <TransactionSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <Section
              title="Buying" items={buying} role="buyer"
              onUpdate={handleStatusUpdate} onReview={openReview} reviewedIds={reviewedIds}
              emptyMsg="You haven't made any purchases yet."
              emptyLink="/" emptyLinkLabel="Browse listings"
            />
            <Section
              title="Selling" items={selling} role="seller"
              onUpdate={handleStatusUpdate} onReview={openReview} reviewedIds={reviewedIds}
              emptyMsg="You haven't sold any books yet."
              emptyLink="/listings/create" emptyLinkLabel="List a book"
            />
          </>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {/* Backdrop */}
          <div onClick={closeReview} style={{ position: 'absolute', inset: 0,
            backgroundColor: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(4px)' }} />

          {/* Modal card */}
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)', width: '100%', maxWidth: 440, padding: 28 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600,
                  color: '#1C1917', margin: 0 }}>
                  Leave a Review
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#A8A29E', margin: '4px 0 0' }}>
                  Reviewing {reviewModal.role === 'seller'
                    ? `buyer: ${reviewModal.transaction.buyer.username}`
                    : `seller: ${reviewModal.transaction.seller.username}`}
                </p>
              </div>
              <button onClick={closeReview} style={{ background: '#F5F5F4', border: 'none',
                borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18,
                color: '#57534E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            {/* Book preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              background: '#F5F5F4', borderRadius: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 20 }}>📖</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
                color: '#1C1917' }}>
                {reviewModal.transaction.listing.title}
              </span>
            </div>

            <form onSubmit={handleSubmitReview}>
              {/* Star rating */}
              <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 13,
                fontWeight: 700, color: '#1C1917', marginBottom: 10,
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rating
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <StarPicker value={reviewRating} onChange={setReviewRating} />
                {reviewRating > 0 && (
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14,
                    color: '#D4A853', fontWeight: 600 }}>
                    {ratingLabels[reviewRating]}
                  </span>
                )}
              </div>

              {/* Comment */}
              <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 13,
                fontWeight: 700, color: '#1C1917', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Comment <span style={{ color: '#A8A29E', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience with this transaction..."
                rows={3}
                style={{ width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                  border: '1.5px solid #E7E5E4', borderRadius: 12, resize: 'none',
                  fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#1C1917',
                  outline: 'none', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                onBlur={e => e.target.style.borderColor = '#E7E5E4'}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" onClick={closeReview} style={{ flex: 1, padding: '11px',
                  border: '1.5px solid #E7E5E4', borderRadius: 12, fontFamily: "'Inter', sans-serif",
                  fontSize: 14, fontWeight: 500, color: '#57534E', background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={reviewLoading || reviewRating === 0} style={{
                  flex: 1, padding: '11px', border: 'none', borderRadius: 12,
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                  color: '#fff',
                  backgroundColor: reviewLoading || reviewRating === 0 ? '#A8A29E' : '#2D6A4F',
                  cursor: reviewLoading || reviewRating === 0 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s' }}
                  onMouseEnter={e => { if (!reviewLoading && reviewRating > 0) e.currentTarget.style.backgroundColor = '#52B788' }}
                  onMouseLeave={e => { if (!reviewLoading && reviewRating > 0) e.currentTarget.style.backgroundColor = '#2D6A4F' }}
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
