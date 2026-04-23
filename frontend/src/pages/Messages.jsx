import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function ConversationSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
      padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F5F5F4', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, background: '#F5F5F4', borderRadius: 8, width: '45%' }} />
        <div style={{ height: 12, background: '#F5F5F4', borderRadius: 8, width: '70%' }} />
      </div>
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/messages/conversations')
      .then(({ data }) => setConversations(data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load messages'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 30, fontWeight: 600,
          color: '#1C1917', marginBottom: 8 }}>
          Messages
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#57534E', marginBottom: 32 }}>
          Your conversations with buyers and sellers.
        </p>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16, fontFamily: "'Inter', sans-serif",
            fontSize: 14, color: '#DC2626' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => <ConversationSkeleton key={i} />)}
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff',
            borderRadius: 24, border: '1px solid #E7E5E4' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
            <p style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600,
              color: '#1C1917', marginBottom: 8 }}>
              No conversations yet
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#A8A29E', marginBottom: 20 }}>
              Find a book you like and message the seller to get started.
            </p>
            <Link to="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
              color: '#2D6A4F', textDecoration: 'none' }}>
              Browse listings →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {conversations.map(msg => {
              const other = msg.sender?._id?.toString() === user?.id?.toString() ? msg.receiver : msg.sender
              const isUnread = !msg.read && msg.receiver?._id?.toString() === user?.id?.toString()
              return (
                <Link
                  key={msg._id}
                  to={`/messages/${msg.listing._id}?with=${other._id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    background: '#fff', borderRadius: 16,
                    border: isUnread ? '1.5px solid #2D6A4F' : '1px solid #E7E5E4',
                    padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: isUnread ? '0 0 0 3px rgba(45,106,79,0.08)' : 'none',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#52B788'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,106,79,0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isUnread ? '#2D6A4F' : '#E7E5E4'
                      e.currentTarget.style.boxShadow = isUnread ? '0 0 0 3px rgba(45,106,79,0.08)' : 'none'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', backgroundColor: '#2D6A4F',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FAFAF8', fontFamily: "'Inter', sans-serif",
                      fontWeight: 700, fontSize: 16, flexShrink: 0,
                    }}>
                      {other.username?.[0]?.toUpperCase()}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15,
                          fontWeight: isUnread ? 700 : 600, color: '#1C1917' }}>
                          {other.username}
                        </span>
                        {isUnread && (
                          <span style={{ width: 8, height: 8, backgroundColor: '#D4A853',
                            borderRadius: '50%', flexShrink: 0 }} />
                        )}
                      </div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
                        color: '#A8A29E', margin: '0 0 3px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📖 {msg.listing.title}
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13,
                        color: isUnread ? '#1C1917' : '#57534E',
                        fontWeight: isUnread ? 500 : 400, margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}