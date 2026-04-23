import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

function TransactionCard({ transaction: t, role, onUpdate }) {
  const isSeller = role === 'seller'
  const s = statusConfig[t.status] || statusConfig.pending

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
      padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start',
      transition: 'border-color 0.15s', }}
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
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}
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
          {isSeller && t.status === 'confirmed' && (
            <ActionBtn label="Mark Complete" onClick={() => onUpdate(t._id, 'completed')}
              bg="#2D6A4F" hover="#52B788" />
          )}

          {/* Buyer actions */}
          {!isSeller && t.status === 'pending' && (
            <ActionBtn label="Cancel Request" onClick={() => onUpdate(t._id, 'cancelled')}
              bg="#fff" color="#DC2626" border="#FECACA" hover="#FEF2F2" />
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

function Section({ title, items, emptyMsg, emptyLink, emptyLinkLabel, role, onUpdate }) {
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
            <TransactionCard key={t._id} transaction={t} role={role} onUpdate={onUpdate} />
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

  const fetchTransactions = () => {
    api.get('/transactions/my')
      .then(({ data }) => setTransactions(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTransactions() }, [])

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/transactions/${id}/status`, { status })
      toast.success(`Transaction ${status}`)
      fetchTransactions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  const buying  = transactions.filter(t => t.buyer._id  === user.id)
  const selling = transactions.filter(t => t.seller._id === user.id)

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
              title="Buying" items={buying} role="buyer" onUpdate={handleStatusUpdate}
              emptyMsg="You haven't made any purchases yet."
              emptyLink="/" emptyLinkLabel="Browse listings"
            />
            <Section
              title="Selling" items={selling} role="seller" onUpdate={handleStatusUpdate}
              emptyMsg="You haven't sold any books yet."
              emptyLink="/listings/create" emptyLinkLabel="List a book"
            />
          </>
        )}
      </div>
    </div>
  )
}