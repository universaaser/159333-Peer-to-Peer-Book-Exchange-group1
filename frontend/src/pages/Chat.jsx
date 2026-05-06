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
  const [showContactShare, setShowContactShare] = useState(false)
  const [contactNote, setContactNote] = useState('')
  const bottomRef = useRef(null)

  const markUnreadAsRead = async (msgs) => {
    const unread = msgs.filter(
      m => !m.read && m.receiver?._id?.toString() === user?.id?.toString()
    )
    await Promise.allSettled(unread.map(m => api.put(`/messages/${m._id}/read`)))
  }

  const fetchMessages = async () => {
    try {
      const params = withUser ? { withUser } : {}
      const { data } = await api.get(`/messages/listing/${listingId}`, { params })
      setMessages(data)
      markUnreadAsRead(data)
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

  const handleShareContact = async () => {
    if (!withUser) return
    const parts = [`📧 Contact details:\nEmail: ${user.email}`]
    if (contactNote.trim()) parts.push(contactNote.trim())
    setSending(true)
    try {
      const { data } = await api.post('/messages', {
        receiverId: withUser,
        listingId,
        content: parts.join('\n'),
      })
      setMessages(prev => [...prev, data])
      setShowContactShare(false)
      setContactNote('')
      toast.success('Contact details sent!')
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
        <Link to="/messages" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          {listing && (
            <>
              <p className="font-semibold text-slate-800 text-sm truncate">{listing.title}</p>
              <p className="text-xs text-slate-400">${listing.price} · {listing.condition}</p>
            </>
          )}
        </div>
        {withUser && (
          <button
            onClick={() => setShowContactShare(v => !v)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              showContactShare
                ? 'bg-green-100 text-green-800'
                : 'bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            Share Contact
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10">No messages yet. Start the conversation!</p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender?._id?.toString() === user?.id?.toString()
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

      {/* Contact share panel */}
      {showContactShare && (
        <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <p className="text-sm font-semibold text-slate-800 mb-0.5">Share your contact details</p>
          <p className="text-xs text-slate-500 mb-3">
            This will be sent as a message — only visible to the person in this chat.
          </p>

          {/* Email (read-only) */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 mb-2">
            <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{user.email}</span>
          </div>

          {/* Optional extra info */}
          <input
            type="text"
            value={contactNote}
            onChange={e => setContactNote(e.target.value)}
            placeholder="Phone number or other info (optional)"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3 bg-white"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShareContact}
              disabled={sending}
              className="flex-1 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Contact Details'}
            </button>
            <button
              type="button"
              onClick={() => { setShowContactShare(false); setContactNote('') }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
