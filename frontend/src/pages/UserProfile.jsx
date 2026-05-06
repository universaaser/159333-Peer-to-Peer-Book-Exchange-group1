import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'

const conditionBadge = {
  'New':      { bg: '#D1FAE5', color: '#065F46' },
  'Like New': { bg: '#DBEAFE', color: '#1E40AF' },
  'Good':     { bg: '#FEF9C3', color: '#854D0E' },
  'Fair':     { bg: '#FFEDD5', color: '#9A3412' },
}

function Stars({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#D4A853' : 'none'}
          stroke={i <= Math.round(rating) ? '#D4A853' : '#D1D5DB'}
          strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </span>
  )
}

function ListingCard({ listing }) {
  const [hovered, setHovered] = useState(false)
  const badge = conditionBadge[listing.condition] || { bg: '#F5F5F4', color: '#57534E' }
  return (
    <Link to={`/listings/${listing._id}`} style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{
        background: '#fff', borderRadius: 16,
        border: hovered ? '1px solid #52B788' : '1px solid #E7E5E4',
        boxShadow: hovered ? '0 8px 24px rgba(45,106,79,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.2s ease', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', aspectRatio: '3/4', background: '#F5F5F4', overflow: 'hidden' }}>
          {listing.images?.[0] ? (
            <img src={listing.images[0]} alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#A8A29E' }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 9px', borderRadius: 999,
            fontSize: 11, fontWeight: 600, fontFamily: "'Inter', sans-serif",
            backgroundColor: badge.bg, color: badge.color }}>
            {listing.condition}
          </span>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <p style={{ fontFamily: "'Lora', serif", fontSize: 13, fontWeight: 600, color: '#1C1917',
            margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.title}
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700,
            color: '#D4A853', margin: 0 }}>
            ${listing.price}
          </p>
        </div>
      </div>
    </Link>
  )
}

function ReviewCard({ review }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-NZ', { year: 'numeric', month: 'short' })
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#2D6A4F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FAFAF8', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {review.reviewer?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
              color: '#1C1917', margin: 0 }}>
              {review.reviewer?.username}
            </p>
            {review.listing?.title && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#A8A29E', margin: 0 }}>
                📖 {review.listing.title}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <Stars rating={review.rating} size={13} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#A8A29E' }}>{date}</span>
        </div>
      </div>
      {review.comment && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#57534E',
          margin: 0, lineHeight: 1.6 }}>
          "{review.comment}"
        </p>
      )}
    </div>
  )
}

export default function UserProfile() {
  const { id } = useParams()
  const [profile, setProfile]   = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/listings?sellerId=${id}`),
      api.get(`/reviews/user/${id}`),
    ]).then(([userRes, listingsRes, reviewsRes]) => {
      setProfile(userRes.data)
      setListings(Array.isArray(listingsRes.data) ? listingsRes.data : (listingsRes.data.data || []))
      setReviews(reviewsRes.data)
    }).catch(err => {
      if (err.response?.status === 404) setNotFound(true)
    }).finally(() => setLoading(false))
  }, [id])

  const memberSince = profile
    ? new Date(profile.createdAt).toLocaleDateString('en-NZ', { year: 'numeric', month: 'long' })
    : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4',
          padding: '32px', marginBottom: 32, display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F5F5F4', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 20, background: '#F5F5F4', borderRadius: 8, width: '30%' }} />
            <div style={{ height: 14, background: '#F5F5F4', borderRadius: 8, width: '20%' }} />
          </div>
        </div>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 600, color: '#1C1917' }}>
          User not found
        </p>
        <Link to="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14,
          color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
          Back to Browse →
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Profile card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4',
          padding: '28px 32px', marginBottom: 36, display: 'flex', gap: 20, alignItems: 'center',
          flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#2D6A4F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FAFAF8', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 28, flexShrink: 0 }}>
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 600,
              color: '#1C1917', margin: '0 0 6px' }}>
              {profile?.username}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Stars rating={profile?.rating || 0} size={16} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#57534E' }}>
                {profile?.rating > 0
                  ? `${profile.rating.toFixed(1)} · ${profile.reviewCount} review${profile.reviewCount !== 1 ? 's' : ''}`
                  : 'No reviews yet'}
              </span>
              <span style={{ color: '#D1D5DB' }}>·</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#A8A29E' }}>
                Member since {memberSince}
              </span>
            </div>
            {profile?.bio && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#57534E',
                margin: '10px 0 0', lineHeight: 1.6 }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Listings */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600,
            color: '#1C1917', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Available Listings
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              backgroundColor: '#F3F2EF', color: '#57534E', padding: '2px 10px', borderRadius: 999 }}>
              {listings.length}
            </span>
          </h2>
          {listings.length === 0 ? (
            <div style={{ padding: '28px 24px', background: '#fff', borderRadius: 16,
              border: '1px solid #E7E5E4', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#A8A29E', margin: 0 }}>
                No listings for sale at the moment.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {listings.map(l => <ListingCard key={l._id} listing={l} />)}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600,
            color: '#1C1917', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Reviews
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              backgroundColor: '#F3F2EF', color: '#57534E', padding: '2px 10px', borderRadius: 999 }}>
              {reviews.length}
            </span>
          </h2>
          {reviews.length === 0 ? (
            <div style={{ padding: '28px 24px', background: '#fff', borderRadius: 16,
              border: '1px solid #E7E5E4', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#A8A29E', margin: 0 }}>
                No reviews yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
