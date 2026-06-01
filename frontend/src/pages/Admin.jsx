import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

const LISTING_STATUSES = ['pending', 'available', 'reserved', 'sold', 'removed']

const statusColors = {
  available: { bg: '#D1FAE5', color: '#065F46' },
  reserved:  { bg: '#DBEAFE', color: '#1E40AF' },
  sold:      { bg: '#F3F2EF', color: '#57534E' },
  removed:   { bg: '#FEE2E2', color: '#DC2626' },
  pending:   { bg: '#FEF9C3', color: '#854D0E' },
  open:      { bg: '#FEF9C3', color: '#854D0E' },
  reviewing: { bg: '#DBEAFE', color: '#1E40AF' },
  closed:    { bg: '#F3F2EF', color: '#57534E' },
}

function Badge({ status }) {
  const s = statusColors[status] || { bg: '#F3F2EF', color: '#57534E' }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
      fontFamily: "'Inter', sans-serif", backgroundColor: s.bg, color: s.color,
      textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

/* ─── Drilldown Modal ─── */
function DrilldownModal({ modal, loading, onClose }) {
  if (!modal) return null

  const fmt = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #E7E5E4',
        }}>
          <p style={{ fontFamily: "'Lora', serif", fontSize: 17, fontWeight: 700,
            color: '#1C1917', margin: 0 }}>
            {modal.title}
          </p>
          <button onClick={onClose} style={{
            background: '#F5F5F4', border: 'none', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#57534E',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
          {loading ? (
            <p style={{ fontFamily: "'Inter', sans-serif", color: '#A8A29E',
              textAlign: 'center', padding: '32px 0' }}>Loading...</p>
          ) : modal.items.length === 0 ? (
            <p style={{ fontFamily: "'Inter', sans-serif", color: '#A8A29E',
              textAlign: 'center', padding: '32px 0' }}>No records found.</p>
          ) : modal.type === 'transaction' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modal.items.map(t => (
                <div key={t._id} style={{
                  border: '1px solid #E7E5E4', borderRadius: 12, padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontFamily: "'Lora', serif", fontSize: 14, fontWeight: 600,
                      color: '#1C1917', margin: '0 0 6px' }}>
                      {t.listing?.title ?? '—'}
                    </p>
                    <Badge status={t.status} />
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
                    color: '#78716C', margin: '0 0 2px' }}>
                    Buyer: <strong>{t.buyer?.username}</strong>
                    {' · '}Seller: <strong>{t.seller?.username}</strong>
                    {' · '}Type: <strong>{t.type}</strong>
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
                    color: '#A8A29E', margin: 0 }}>
                    ${t.price} · {fmt(t.createdAt)}
                    {t.paidAt && ` · Paid ${fmt(t.paidAt)}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modal.items.map(r => (
                <div key={r._id} style={{
                  border: '1px solid #E7E5E4', borderRadius: 12, padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14,
                      fontWeight: 600, color: '#1C1917', margin: '0 0 6px' }}>
                      {r.reason}
                    </p>
                    <Badge status={r.status} />
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
                    color: '#78716C', margin: '0 0 2px' }}>
                    Reporter: <strong>{r.reporter?.username}</strong>
                    {r.reportedUser && <> · Against: <strong>{r.reportedUser?.username}</strong></>}
                    {r.listing && <> · Listing: <strong>{r.listing?.title}</strong></>}
                  </p>
                  {r.details && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
                      color: '#A8A29E', margin: '4px 0 0', fontStyle: 'italic' }}>
                      "{r.details}"
                    </p>
                  )}
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11,
                    color: '#A8A29E', margin: '4px 0 0' }}>
                    {fmt(r.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Online Users Card ─── */
function OnlineUsersCard() {
  const [onlineData, setOnlineData] = useState({ current: 0, history: [] })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOnline = async () => {
    try {
      const { data } = await api.get('/admin/online')
      setOnlineData(data)
      setLastUpdated(new Date())
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchOnline()
    const id = setInterval(fetchOnline, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1.5px solid #BBF7D0', padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200, borderRadius: '50%',
        backgroundColor: 'rgba(34,197,94,0.05)',
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="pulse-dot-wrapper">
              <span className="pulse-dot-ring" />
              <span className="pulse-dot-core" />
            </span>
            <p style={{ fontFamily: "'Lora', serif", fontSize: 16, fontWeight: 600, color: '#1C1917', margin: 0 }}>
              Online Users
            </p>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
              backgroundColor: '#D1FAE5', color: '#065F46',
              fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em',
            }}>
              LIVE
            </span>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#A8A29E', margin: 0 }}>
            Active within the last 5 minutes · auto-refreshes every 30s
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontFamily: "'Lora', serif", fontSize: 48, fontWeight: 700, lineHeight: 1,
            color: loading ? '#D1D5DB' : '#22C55E', margin: 0,
            transition: 'color 0.4s ease',
          }}>
            {loading ? '—' : onlineData.current}
          </p>
          {lastUpdated && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#A8A29E', margin: '4px 0 0' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {onlineData.history.length > 1 ? (
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={onlineData.history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-online" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0FDF4" vertical={false} />
            <XAxis dataKey="label"
              tick={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fill: '#A8A29E' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false}
              tick={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fill: '#A8A29E' }}
              axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12, borderRadius: 10,
                border: '1px solid #BBF7D0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
              formatter={v => [v, 'Online']}
              labelStyle={{ color: '#57534E', fontWeight: 600 }} />
            <Area type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2.5}
              fill="url(#grad-online)" dot={false}
              activeDot={{ r: 4, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{
          height: 110, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#F0FDF4', borderRadius: 12, gap: 6,
        }}>
          <svg width="20" height="20" fill="none" stroke="#86EFAC" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#86EFAC', margin: 0 }}>
            Building history — check back in 30s
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Analytics Tab ─── */
function AnalyticsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trendPeriod, setTrendPeriod] = useState('week')
  const [trendData, setTrendData] = useState(null)
  const [trendLoading, setTrendLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  const openTransactionDrilldown = async (entry) => {
    const status = entry.name.toLowerCase()
    setModal({ title: `${entry.name} Transactions`, type: 'transaction', items: [] })
    setModalLoading(true)
    try {
      const { data } = await api.get(`/admin/transactions?status=${status}`)
      setModal({ title: `${entry.name} Transactions (${data.length})`, type: 'transaction', items: data })
    } catch {
      setModal(null)
    } finally {
      setModalLoading(false)
    }
  }

  const openReportDrilldown = async (entry) => {
    const status = entry.name.toLowerCase()
    setModal({ title: `${entry.name} Reports`, type: 'report', items: [] })
    setModalLoading(true)
    try {
      const { data } = await api.get(`/reports?status=${status}`)
      setModal({ title: `${entry.name} Reports (${data.length})`, type: 'report', items: data })
    } catch {
      setModal(null)
    } finally {
      setModalLoading(false)
    }
  }

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setTrendLoading(true)
    api.get(`/admin/trends?period=${trendPeriod}`)
      .then(({ data }) => setTrendData(data))
      .catch(() => setTrendData(null))
      .finally(() => setTrendLoading(false))
  }, [trendPeriod])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#A8A29E',
      fontFamily: "'Inter', sans-serif" }}>Loading analytics...</div>
  )
  if (!stats) return null

  const listingPieData = [
    { name: 'Available', value: stats.listings.available, color: '#2D6A4F' },
    { name: 'Sold',      value: stats.listings.sold,      color: '#57534E' },
    { name: 'Reserved',  value: stats.listings.reserved,  color: '#3B82F6' },
    { name: 'Pending',   value: stats.listings.pending,   color: '#D4A853' },
    { name: 'Removed',   value: stats.listings.removed,   color: '#DC2626' },
  ].filter(d => d.value > 0)

  const transactionBarData = [
    { name: 'Pending',   count: stats.transactions.pending,   fill: '#D4A853' },
    { name: 'Confirmed', count: stats.transactions.confirmed, fill: '#3B82F6' },
    { name: 'Completed', count: stats.transactions.completed, fill: '#2D6A4F' },
    { name: 'Cancelled', count: stats.transactions.cancelled, fill: '#DC2626' },
  ]

  const reportBarData = [
    { name: 'Open',      count: stats.reports.open,      fill: '#D4A853' },
    { name: 'Reviewing', count: stats.reports.reviewing, fill: '#3B82F6' },
    { name: 'Closed',    count: stats.reports.closed,    fill: '#57534E' },
  ]

  const userPieData = [
    { name: 'Regular Users', value: stats.users.active, color: '#2D6A4F' },
    { name: 'Admins',        value: stats.users.admins, color: '#D4A853' },
    { name: 'Banned',        value: stats.users.banned, color: '#DC2626' },
  ].filter(d => d.value > 0)

  const cardStyle = {
    background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
    padding: '24px', display: 'flex', flexDirection: 'column', gap: 16,
  }
  const titleStyle = {
    fontFamily: "'Lora', serif", fontSize: 16, fontWeight: 600,
    color: '#1C1917', margin: 0,
  }
  const subStyle = {
    fontFamily: "'Inter', sans-serif", fontSize: 12,
    color: '#A8A29E', margin: '2px 0 0',
  }

  const TREND_SERIES = [
    { key: 'users',        label: 'New Registrations', color: '#3B82F6', bg: '#EFF6FF', icon: '👤' },
    { key: 'listings',     label: 'New Listings',       color: '#2D6A4F', bg: '#F0FAF4', icon: '📚' },
    { key: 'transactions', label: 'New Transactions',   color: '#D4A853', bg: '#FFFBEB', icon: '🔄' },
    { key: 'reports',      label: 'New Reports',        color: '#DC2626', bg: '#FEF2F2', icon: '⚑' },
  ]

  const xAxisInterval = trendPeriod === 'month' ? 4 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Row 1: Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Books',    value: stats.listings.total,      color: '#2D6A4F', bg: '#F0FAF4', icon: '📚' },
          { label: 'Books Sold',     value: stats.listings.sold,       color: '#57534E', bg: '#F5F5F4', icon: '✅' },
          { label: 'Total Users',    value: stats.users.total,         color: '#3B82F6', bg: '#EFF6FF', icon: '👤' },
          { label: 'Transactions',   value: stats.transactions.total,  color: '#D4A853', bg: '#FFFBEB', icon: '🔄' },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} style={{ background: bg, borderRadius: 14,
            border: `1px solid ${color}22`, padding: '18px 20px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
              color, margin: '0 0 8px' }}>{icon} {label}</p>
            <p style={{ fontFamily: "'Lora', serif", fontSize: 30, fontWeight: 700,
              color: '#1C1917', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Online Users real-time card */}
      <OnlineUsersCard />

      {/* Row 2: Activity Trends (time dimension) */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4', padding: '24px' }}>
        {/* Header + period toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={titleStyle}>Activity Trends</p>
            <p style={subStyle}>New registrations, listings, transactions & reports over time</p>
          </div>
          <div style={{ display: 'flex', gap: 6, background: '#F5F5F4', borderRadius: 20, padding: 4 }}>
            {[['week', 'Past Week'], ['month', 'Past Month'], ['year', 'Past Year']].map(([val, label]) => (
              <button key={val} onClick={() => setTrendPeriod(val)}
                style={{
                  padding: '5px 16px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                  backgroundColor: trendPeriod === val ? '#1C1917' : 'transparent',
                  color: trendPeriod === val ? '#FAFAF8' : '#78716C',
                  transition: 'all 0.15s',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#A8A29E',
            fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Loading trends...</div>
        ) : !trendData ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#A8A29E',
            fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Could not load trend data.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {TREND_SERIES.map(({ key, label, color, bg, icon }) => {
              const points = trendData.labels.map((name, i) => ({ name, value: trendData[key][i] }))
              const total  = trendData[key].reduce((a, b) => a + b, 0)
              const peak   = Math.max(...trendData[key])
              return (
                <div key={key}>
                  {/* Mini header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 10 }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13,
                      fontWeight: 700, color: '#1C1917', margin: 0 }}>
                      {icon} {label}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
                        padding: '2px 10px', borderRadius: 20, backgroundColor: bg, color }}>
                        {total} total
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                        padding: '2px 10px', borderRadius: 20, backgroundColor: '#F5F5F4', color: '#78716C' }}>
                        peak {peak}
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={points} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" vertical={false} />
                      <XAxis dataKey="name"
                        tick={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fill: '#A8A29E' }}
                        axisLine={false} tickLine={false}
                        interval={xAxisInterval} />
                      <YAxis allowDecimals={false}
                        tick={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fill: '#A8A29E' }}
                        axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12,
                          borderRadius: 10, border: '1px solid #E7E5E4', boxShadow: '0 4px 12px #0001' }}
                        formatter={v => [v, label]}
                        labelStyle={{ color: '#57534E', fontWeight: 600 }} />
                      <Area type="monotone" dataKey="value"
                        stroke={color} strokeWidth={2}
                        fill={`url(#grad-${key})`}
                        dot={false}
                        activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Row 3: Listing pie + User pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Listing Status Distribution */}
        <div style={cardStyle}>
          <div>
            <p style={titleStyle}>Book Listing Status</p>
            <p style={subStyle}>Distribution of all {stats.listings.total} listings by current status</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={listingPieData} cx="50%" cy="50%"
                innerRadius={65} outerRadius={100}
                paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {listingPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]}
                contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 13, borderRadius: 10 }} />
              <Legend iconType="circle" wrapperStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {listingPieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: d.color }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#57534E' }}>
                  {d.name}: <strong>{d.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Distribution */}
        <div style={cardStyle}>
          <div>
            <p style={titleStyle}>User Account Breakdown</p>
            <p style={subStyle}>{stats.users.total} registered accounts total</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={userPieData} cx="50%" cy="50%"
                innerRadius={65} outerRadius={100}
                paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {userPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]}
                contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 13, borderRadius: 10 }} />
              <Legend iconType="circle" wrapperStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {userPieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: d.color }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#57534E' }}>
                  {d.name}: <strong>{d.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Transaction bar + Report bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Transaction Status */}
        <div style={cardStyle}>
          <div>
            <p style={titleStyle}>Transaction Status</p>
            <p style={subStyle}>
              {stats.transactions.total} transactions across all users
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11,
                color: '#A8A29E', marginLeft: 8 }}>· click a bar to view records</span>
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={transactionBarData} barSize={36}
              margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
              style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F5F5F420' }}
                contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 13, borderRadius: 10 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} onClick={openTransactionDrilldown}>
                {transactionBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Report Status */}
        <div style={cardStyle}>
          <div>
            <p style={titleStyle}>Report Status</p>
            <p style={subStyle}>
              {stats.reports.total} reports submitted in total
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11,
                color: '#A8A29E', marginLeft: 8 }}>· click a bar to view records</span>
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reportBarData} barSize={36}
              margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
              style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F5F5F420' }}
                contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 13, borderRadius: 10 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} onClick={openReportDrilldown}>
                {reportBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DrilldownModal
        modal={modal}
        loading={modalLoading}
        onClose={() => setModal(null)}
      />
    </div>
  )
}

/* ─── Listings Tab ─── */
function ListingsTab() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')

  const fetchListings = async () => {
    setLoading(true)
    try {
      let url = '/listings?includeFlagged=true'
      if (statusFilter) url += `&status=${statusFilter}`
      if (keyword.trim()) url += `&keyword=${encodeURIComponent(keyword.trim())}`
      const { data } = await api.get(url)
      const items = Array.isArray(data) ? data : (data.data || [])
      setListings(items)
    } catch { setListings([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchListings() }, [statusFilter])

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      await api.patch(`/listings/${listingId}/status`, { status: newStatus })
      toast.success(`Status updated to "${newStatus}"`)
      fetchListings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Search by title..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchListings()}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #E7E5E4',
            fontFamily: "'Inter', sans-serif", fontSize: 14, outline: 'none', flex: 1, minWidth: 180 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #E7E5E4',
            fontFamily: "'Inter', sans-serif", fontSize: 14, outline: 'none', cursor: 'pointer' }}>
          <option value="">All statuses</option>
          {LISTING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchListings}
          style={{ padding: '8px 18px', borderRadius: 10, border: 'none',
            backgroundColor: '#2D6A4F', color: '#fff', fontFamily: "'Inter', sans-serif",
            fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Search
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#A8A29E',
          fontFamily: "'Inter', sans-serif" }}>Loading...</div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#A8A29E',
          fontFamily: "'Inter', sans-serif" }}>No listings found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {listings.map(l => (
            <div key={l._id} style={{ background: '#fff', border: l.flagged ? '1.5px solid #FCA5A5' : '1px solid #E7E5E4',
              borderRadius: 14, padding: '16px 20px', display: 'flex',
              alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Thumbnail */}
              <div style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#F5F5F4',
                overflow: 'hidden', flexShrink: 0, border: '1px solid #E7E5E4',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {l.images?.[0]
                  ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 20 }}>📖</span>}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontFamily: "'Lora', serif", fontSize: 14, fontWeight: 600,
                  color: '#1C1917', margin: '0 0 4px' }}>
                  {l.title}
                  {l.flagged && <span style={{ marginLeft: 8, fontSize: 11, color: '#DC2626',
                    fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>⚑ Flagged</span>}
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#A8A29E', margin: 0 }}>
                  Seller: {l.seller?.username} · ${l.price}
                  {l.course && ` · ${l.course}`}
                </p>
              </div>
              {/* Status badge */}
              <Badge status={l.status} />
              {/* Status change */}
              <select
                value={l.status}
                onChange={e => handleStatusChange(l._id, e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E7E5E4',
                  fontFamily: "'Inter', sans-serif", fontSize: 13, cursor: 'pointer', outline: 'none' }}>
                {LISTING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleBan = async (userId, isBanned) => {
    try {
      await api.patch(`/users/${userId}/ban`, { isBanned })
      toast.success(isBanned ? 'User banned' : 'User unbanned')
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, isBanned } : u
      ))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#A8A29E',
      fontFamily: "'Inter', sans-serif" }}>Loading...</div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {users.map(u => (
        <div key={u._id} style={{ background: '#fff', border: '1px solid #E7E5E4',
          borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%',
              backgroundColor: u.role === 'admin' ? '#D4A853' : '#2D6A4F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
              {u.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                color: '#1C1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.username}
                {u.isBanned && <span style={{ marginLeft: 6, fontSize: 11, color: '#DC2626',
                  fontWeight: 700 }}>[BANNED]</span>}
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#A8A29E',
                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.email}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid #F5F5F4', paddingTop: 10 }}>
            <div>
              <Badge status={u.role} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#A8A29E',
                marginLeft: 8 }}>
                ⭐ {u.rating?.toFixed(1) ?? '0.0'} ({u.reviewCount ?? 0})
              </span>
            </div>
            {u.role !== 'admin' && (
              <button
                onClick={() => handleBan(u._id, !u.isBanned)}
                style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                  backgroundColor: u.isBanned ? '#D1FAE5' : '#FEE2E2',
                  color: u.isBanned ? '#065F46' : '#DC2626',
                  transition: 'opacity 0.15s' }}>
                {u.isBanned ? 'Unban' : 'Ban'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Reports Tab ─── */
function ReportsTab() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')

  const fetchReports = async (s = statusFilter) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/reports${s ? `?status=${s}` : ''}`)
      setReports(data)
    } catch { setReports([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReports() }, [statusFilter])

  const handleUpdateStatus = async (reportId, status) => {
    try {
      await api.patch(`/reports/${reportId}/status`, { status })
      toast.success(`Report marked as "${status}"`)
      fetchReports()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report')
    }
  }

  return (
    <div>
      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['open', 'reviewing', 'closed', ''].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              backgroundColor: statusFilter === s ? '#1C1917' : '#F5F5F4',
              color: statusFilter === s ? '#FAFAF8' : '#57534E',
              transition: 'all 0.15s' }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#A8A29E',
          fontFamily: "'Inter', sans-serif" }}>Loading...</div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#A8A29E',
          fontFamily: "'Inter', sans-serif" }}>No reports found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(r => (
            <div key={r._id} style={{ background: '#fff', border: '1px solid #E7E5E4',
              borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                    color: '#1C1917', margin: '0 0 4px' }}>
                    {r.reason}
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#A8A29E', margin: 0 }}>
                    Reporter: <strong>{r.reporter?.username}</strong>
                    {r.reportedUser && <> · Reported user: <strong>{r.reportedUser?.username}</strong></>}
                    {r.listing && <> · Listing: <strong>{r.listing?.title}</strong></>}
                  </p>
                </div>
                <Badge status={r.status} />
              </div>
              {r.status !== 'closed' && (
                <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #F5F5F4' }}>
                  {r.status === 'open' && (
                    <ActionBtn label="Mark Reviewing" onClick={() => handleUpdateStatus(r._id, 'reviewing')}
                      bg="#DBEAFE" color="#1E40AF" />
                  )}
                  <ActionBtn label="Close Report" onClick={() => handleUpdateStatus(r._id, 'closed')}
                    bg="#F3F2EF" color="#57534E" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionBtn({ label, onClick, bg, color }) {
  return (
    <button onClick={onClick}
      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
        backgroundColor: bg, color, transition: 'opacity 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      {label}
    </button>
  )
}

/* ─── Main Admin Page ─── */
const TABS = ['Analytics', 'Listings', 'Users', 'Reports']

export default function Admin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Analytics')
  const [stats, setStats] = useState({ listings: 0, users: 0, openReports: 0 })

  useEffect(() => {
    Promise.allSettled([
      api.get('/listings?includeFlagged=true'),
      api.get('/users'),
      api.get('/reports?status=open'),
    ]).then(([listingsRes, usersRes, reportsRes]) => {
      const listings = listingsRes.status === 'fulfilled'
        ? (listingsRes.value.data?.data || listingsRes.value.data || [])
        : []
      const users = usersRes.status === 'fulfilled' ? usersRes.value.data : []
      const reports = reportsRes.status === 'fulfilled' ? reportsRes.value.data : []
      setStats({
        listings: Array.isArray(listings) ? listings.length : 0,
        users: Array.isArray(users) ? users.length : 0,
        openReports: Array.isArray(reports) ? reports.length : 0,
      })
    })
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F5' }}>
      {/* Admin Header */}
      <div style={{ backgroundColor: '#1C1917', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 600, color: '#D4A853' }}>
            📚 BookSwap
          </span>
          <span style={{ padding: '3px 12px', borderRadius: 999, backgroundColor: '#D4A853',
            color: '#1C1917', fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14,
            color: 'rgba(250,250,248,0.6)' }}>
            {user?.username}
          </span>
          <button onClick={handleLogout}
            style={{ padding: '7px 16px', borderRadius: 10,
              border: '1px solid rgba(250,250,248,0.2)', background: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
              color: 'rgba(250,250,248,0.7)', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4A853'; e.currentTarget.style.color = '#D4A853' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(250,250,248,0.2)'; e.currentTarget.style.color = 'rgba(250,250,248,0.7)' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Listings', value: stats.listings, icon: '📖' },
            { label: 'Total Users',    value: stats.users,    icon: '👤' },
            { label: 'Open Reports',  value: stats.openReports, icon: '⚑',
              urgent: stats.openReports > 0 },
          ].map(({ label, value, icon, urgent }) => (
            <div key={label} style={{ background: '#fff',
              border: urgent ? '1.5px solid #FCA5A5' : '1px solid #E7E5E4',
              borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13,
                color: urgent ? '#DC2626' : '#A8A29E', margin: '0 0 6px', fontWeight: 600 }}>
                {icon} {label}
              </p>
              <p style={{ fontFamily: "'Lora', serif", fontSize: 32, fontWeight: 700,
                color: urgent ? '#DC2626' : '#1C1917', margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #E7E5E4' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                  borderBottom: activeTab === tab ? '2px solid #1C1917' : '2px solid transparent',
                  backgroundColor: activeTab === tab ? '#FAFAF8' : '#fff',
                  color: activeTab === tab ? '#1C1917' : '#A8A29E',
                  transition: 'all 0.15s' }}>
                {tab}
                {tab === 'Reports' && stats.openReports > 0 && (
                  <span style={{ marginLeft: 6, backgroundColor: '#DC2626', color: '#fff',
                    borderRadius: '50%', fontSize: 11, fontWeight: 700,
                    padding: '1px 6px', display: 'inline-block' }}>
                    {stats.openReports}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ padding: 24 }}>
            {activeTab === 'Analytics' && <AnalyticsTab />}
            {activeTab === 'Listings'  && <ListingsTab />}
            {activeTab === 'Users'     && <UsersTab />}
            {activeTab === 'Reports'   && <ReportsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
