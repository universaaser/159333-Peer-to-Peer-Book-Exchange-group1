import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Chat() {
  const { listingId } = useParams()
  const [searchParams] = useSearchParams()
  const withUser = searchParams.get('with')
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [listing, setListing] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const fetchMessages = async () => {
    try {
      const params = withUser ? { withUser } : {}
      const { data } = await api.get(`/messages/listing/${listingId}`, { params })
      setMessages(data)
    } catch {
      toast.error('Failed to load messages')
    }
  }

  useEffect(() => {
    Promise.all([
      api.get(`/listings/${listingId}`).then(({ data }) => setListing(data)).catch(() => {}),
      fetchMessages()
    ]).finally(() => setLoading(false))
  }, [listingId, withUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!content.trim() || !withUser) return
    setSending(true)
    try {
      const { data } = await api.post('/messages', {
        receiverId: withUser,
        listingId,
        content: content.trim()
      })
      setMessages(prev => [...prev, data])
      setContent('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? '' : 'justify-end'}`}>
          <div className="h-10 bg-slate-200 rounded-2xl w-48" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
        <Link to="/messages" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          {listing && (
            <>
              <p className="font-semibold text-slate-800 text-sm">{listing.title}</p>
              <p className="text-xs text-slate-400">${listing.price} · {listing.condition}</p>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10">No messages yet. Start the conversation!</p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender._id === user.id
          return (
            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMe && (
                  <p className="text-xs text-slate-400 px-1">{msg.sender.username}</p>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <p className="text-xs text-slate-400 px-1">{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-slate-200">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
