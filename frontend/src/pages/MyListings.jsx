import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'reserved',  label: 'Reserved' },
  { key: 'pending',   label: 'Pending' },
  { key: 'sold',      label: 'Sold' },
  { key: 'removed',   label: 'Removed' },
]

const statusConfig = {
  available: { bg: '#D1FAE5', color: '#065F46', label: 'Available' },
  reserved:  { bg: '#DBEAFE', color: '#1E40AF', label: 'Reserved' },
  pending:   { bg: '#FEF9C3', color: '#854D0E', label: 'Pending' },
  sold:      { bg: '#F3F2EF', color: '#57534E', label: 'Sold' },
  removed:   { bg: '#FEE2E2', color: '#DC2626', label: 'Removed' },
}

const conditionColor = {
  'New':      '#2D6A4F',
  'Like New': '#52B788',
  'Good':     '#D4A853',
  'Fair':     '#A8A29E',
}

function StatusBadge({ status }) {
  const s = statusConfig[status] || { bg: '#F3F2EF', color: '#57534E', label: status }
  return (
    <span style={{
      fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 999,
      backgroundColor: s.bg, color: s.color,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
      padding: 18, display: 'flex', gap: 14 }}>
      <div style={{ width: 72, height: 88, background: '#F5F5F4', borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
        <div style={{ height: 14, background: '#F5F5F4', borderRadius: 8, width: '65%' }} />
        <div style={{ height: 12, background: '#F5F5F4', borderRadius: 8, width: '40%' }} />
        <div style={{ height: 12, background: '#F5F5F4', borderRadius: 8, width: '30%' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <div style={{ height: 28, background: '#F5F5F4', borderRadius: 8, width: 80 }} />
          <div style={{ height: 28, background: '#F5F5F4', borderRadius: 8, width: 60 }} />
        </div>
      </div>
    </div>
  )
}

function ListingCard({ listing, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const s = statusConfig[listing.status] || statusConfig.available
  const canEdit   = ['available', 'pending'].includes(listing.status)
  const canDelete = ['available', 'pending'].includes(listing.status)
  const fmt = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await api.delete(`/listings/${listing._id}`)
      toast.success('Listing deleted')
      onDelete(listing._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        background: '#fff', borderRadius: 16,
        border: listing.flagged ? '1.5px solid #FCA5A5' : '1px solid #E7E5E4',
        padding: 18, display: 'flex', gap: 16, alignItems: 'flex-start',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 72, height: 88, borderRadius: 10, flexShrink: 0,
          backgroundColor: '#F5F5F4', border: '1px solid #E7E5E4',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/listings/${listing._id}`)}
      >
        {listing.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 28 }}>📖</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <Link
            to={`/listings/${listing._id}`}
            style={{
              fontFamily: "'Lora', serif", fontSize: 15, fontWeight: 600,
              color: '#1C1917', textDecoration: 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#2D6A4F'}
            onMouseLeave={e => e.currentTarget.style.color = '#1C1917'}
          >
            {listing.title}
            {listing.flagged && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#DC2626',
                fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                ⚑ Flagged
              </span>
            )}
          </Link>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700,
            color: '#D4A853', whiteSpace: 'nowrap', flexShrink: 0 }}>
            ${listing.price}
          </span>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10,
          alignItems: 'center' }}>
          <StatusBadge status={listing.status} />
          {listing.condition && (
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 999,
              backgroundColor: '#F5F5F4',
              color: conditionColor[listing.condition] || '#57534E',
            }}>
              {listing.condition}
            </span>
          )}
          {listing.course && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
              color: '#78716C' }}>
              {listing.course}
              {listing.subject && ` · ${listing.subject}`}
            </span>
          )}
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
          color: '#A8A29E', margin: '0 0 12px' }}>
          Listed {fmt(listing.createdAt)}
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ActionBtn
            label="View"
            onClick={() => navigate(`/listings/${listing._id}`)}
            bg="#F5F5F4" color="#57534E" hover="#E7E5E4"
          />
          {canEdit && (
            <ActionBtn
              label="Edit"
              onClick={() => navigate(`/listings/${listing._id}/edit`)}
              bg="#EFF6FF" color="#1E40AF" hover="#DBEAFE"
            />
          )}
          {canDelete && (
            confirmDelete ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn
                  label={deleting ? 'Deleting…' : 'Confirm Delete'}
                  onClick={handleDelete}
                  bg="#FEE2E2" color="#DC2626" hover="#FECACA"
                />
                <ActionBtn
                  label="Cancel"
                  onClick={() => setConfirmDelete(false)}
                  bg="#F5F5F4" color="#57534E" hover="#E7E5E4"
                />
              </div>
            ) : (
              <ActionBtn
                label="Delete"
                onClick={handleDelete}
                bg="#fff" color="#DC2626" border="#FECACA" hover="#FEF2F2"
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ label, onClick, bg, color = '#1C1917', border, hover }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 14px', fontSize: 12, fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        backgroundColor: hovered ? hover : bg,
        color,
        border: border ? `1.5px solid ${border}` : '1.5px solid transparent',
        borderRadius: 10, cursor: 'pointer', transition: 'background-color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export default function MyListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    api.get(`/listings?sellerId=${user.id}&includeFlagged=true`)
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : (data.data || [])
        setListings(items)
      })
      .catch(() => toast.error('Failed to load your listings'))
      .finally(() => setLoading(false))
  }, [user])

  const handleDelete = (id) => {
    setListings(prev => prev.filter(l => l._id !== id))
  }

  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? listings.length
      : listings.filter(l => l.status === tab.key).length
    return acc
  }, {})

  const filtered = activeTab === 'all'
    ? listings
    : listings.filter(l => l.status === activeTab)

  const summaryStats = [
    { label: 'Available', count: counts.available, color: '#065F46', bg: '#D1FAE5' },
    { label: 'Reserved',  count: counts.reserved,  color: '#1E40AF', bg: '#DBEAFE' },
    { label: 'Sold',      count: counts.sold,       color: '#57534E', bg: '#F3F2EF' },
    { label: 'Pending',   count: counts.pending,    color: '#854D0E', bg: '#FEF9C3' },
    { label: 'Removed',   count: counts.removed,    color: '#DC2626', bg: '#FEE2E2' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Lora', serif", fontSize: 30, fontWeight: 600,
              color: '#1C1917', margin: 0 }}>
              My Listings
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15,
              color: '#57534E', margin: '6px 0 0' }}>
              Track and manage all the books you have listed.
            </p>
          </div>
          <Link
            to="/listings/create"
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
              backgroundColor: '#2D6A4F', color: '#FAFAF8',
              padding: '10px 20px', borderRadius: 12, textDecoration: 'none',
              transition: 'background-color 0.2s', whiteSpace: 'nowrap', alignSelf: 'flex-start',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#52B788'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D6A4F'}
          >
            + New Listing
          </Link>
        </div>

        {/* Summary stat cards */}
        {!loading && listings.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 24, marginBottom: 28,
            flexWrap: 'wrap' }}>
            {summaryStats.map(({ label, count, color, bg }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label.toLowerCase())}
                style={{
                  flex: '1 1 80px', padding: '14px 12px', borderRadius: 14,
                  backgroundColor: activeTab === label.toLowerCase() ? bg : '#fff',
                  border: activeTab === label.toLowerCase()
                    ? `1.5px solid ${color}44` : '1px solid #E7E5E4',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                }}
              >
                <p style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 700,
                  color: count > 0 ? color : '#D6D3D1', margin: '0 0 2px' }}>
                  {count}
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                  color: count > 0 ? color : '#A8A29E', margin: 0 }}>
                  {label}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Status filter tabs */}
        {!loading && listings.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20,
            backgroundColor: '#F5F5F4', borderRadius: 16, padding: 4,
            overflowX: 'auto' }}>
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                  whiteSpace: 'nowrap',
                  backgroundColor: activeTab === tab.key ? '#fff' : 'transparent',
                  color: activeTab === tab.key ? '#1C1917' : '#78716C',
                  boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span style={{
                    marginLeft: 6,
                    fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 999,
                    backgroundColor: activeTab === tab.key ? '#F5F5F4' : '#E7E5E4',
                    color: '#57534E',
                  }}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4',
          }}>
            <p style={{ fontSize: 40, margin: '0 0 16px' }}>📚</p>
            <p style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600,
              color: '#1C1917', margin: '0 0 8px' }}>
              No listings yet
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14,
              color: '#A8A29E', margin: '0 0 24px' }}>
              You haven't listed any books for sale or exchange.
            </p>
            <Link
              to="/listings/create"
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                backgroundColor: '#2D6A4F', color: '#FAFAF8',
                padding: '10px 24px', borderRadius: 12, textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              List Your First Book
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
          }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14,
              color: '#A8A29E', margin: '0 0 12px' }}>
              No {activeTab} listings.
            </p>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                color: '#2D6A4F', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Show all listings →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(listing => (
              <ListingCard
                key={listing._id}
                listing={listing}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
