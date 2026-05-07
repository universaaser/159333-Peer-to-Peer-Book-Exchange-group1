import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

export default function Payment() {
  const { transactionId } = useParams()
  const navigate = useNavigate()

  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get(`/transactions/${transactionId}`)
      .then(({ data }) => {
        if (data.buyer._id && data.status !== 'confirmed') {
          toast.error('This transaction is not awaiting payment.')
          navigate('/transactions')
          return
        }
        setTransaction(data)
      })
      .catch(() => {
        toast.error('Transaction not found.')
        navigate('/transactions')
      })
      .finally(() => setLoading(false))
  }, [transactionId])

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    const digits = form.cardNumber.replace(/\s/g, '')
    if (digits.length !== 16) e.cardNumber = 'Card number must be 16 digits'
    if (!form.cardHolder.trim()) e.cardHolder = 'Cardholder name is required'
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) e.expiry = 'Use MM/YY format'
    if (!/^\d{3,4}$/.test(form.cvv)) e.cvv = 'CVV must be 3–4 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePay = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setPaying(true)
    try {
      await api.post(`/transactions/${transactionId}/pay`)
      setSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: "'Inter', sans-serif", color: '#A8A29E' }}>Loading…</p>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #E7E5E4',
        padding: '56px 48px', textAlign: 'center', maxWidth: 420, width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#D1FAE5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 36 }}>
          ✓
        </div>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 600,
          color: '#1C1917', margin: '0 0 10px' }}>Payment Successful!</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E',
          margin: '0 0 8px', lineHeight: 1.6 }}>
          You've paid <strong style={{ color: '#1C1917' }}>${transaction?.price?.toFixed(2)}</strong> for
        </p>
        <p style={{ fontFamily: "'Lora', serif", fontSize: 15, fontWeight: 600,
          color: '#2D6A4F', margin: '0 0 32px' }}>
          {transaction?.listing?.title}
        </p>
        <div style={{ background: '#F0FAF4', borderRadius: 12, padding: '14px 20px',
          marginBottom: 32, textAlign: 'left' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#52B788',
            fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Transaction ID
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#1C1917',
            margin: 0, wordBreak: 'break-all' }}>
            {transactionId}
          </p>
        </div>
        <Link to="/transactions"
          style={{ display: 'block', backgroundColor: '#2D6A4F', color: '#FAFAF8',
            fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
            padding: '14px', borderRadius: 14, textDecoration: 'none',
            transition: 'background-color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#52B788'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D6A4F'}>
          View My Transactions
        </Link>
      </div>
    </div>
  )

  const listing = transaction?.listing
  const cardDigits = form.cardNumber.replace(/\s/g, '')
  const isVisa = cardDigits.startsWith('4')
  const isMC   = cardDigits.startsWith('5')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }} className="payment-grid">

        {/* ── Left: Order Summary ── */}
        <div>
          <Link to="/transactions" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#57534E',
            textDecoration: 'none', marginBottom: 28 }}
            onMouseEnter={e => e.currentTarget.style.color = '#1C1917'}
            onMouseLeave={e => e.currentTarget.style.color = '#57534E'}>
            ← Back to Transactions
          </Link>

          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600,
            color: '#1C1917', margin: '0 0 4px' }}>Checkout</h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#57534E',
            margin: '0 0 32px' }}>Review your order before paying.</p>

          {/* Book card */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4',
            padding: 20, display: 'flex', gap: 20, marginBottom: 24 }}>
            <div style={{ width: 80, height: 100, borderRadius: 10, overflow: 'hidden',
              background: '#F5F5F4', flexShrink: 0 }}>
              {listing?.images?.[0]
                ? <img src={listing.images[0]} alt={listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📚</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 16,
                color: '#1C1917', margin: '0 0 6px', lineHeight: 1.4 }}>
                {listing?.title}
              </p>
              {listing?.course && (
                <span style={{ display: 'inline-block', fontSize: 11, padding: '2px 9px',
                  borderRadius: 999, backgroundColor: '#F3F2EF', color: '#57534E',
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, marginBottom: 8 }}>
                  {listing.course}
                </span>
              )}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#A8A29E', margin: 0 }}>
                Condition: {listing?.condition} · Seller: {transaction?.seller?.username}
              </p>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 22,
              color: '#D4A853', flexShrink: 0 }}>
              ${transaction?.price?.toFixed(2)}
            </div>
          </div>

          {/* Price breakdown */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E7E5E4', padding: 20 }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: 15, fontWeight: 600,
              color: '#1C1917', margin: '0 0 16px' }}>Order Summary</h2>
            {[
              ['Book price', `$${transaction?.price?.toFixed(2)}`],
              ['Platform fee', '$0.00'],
              ['Delivery', 'Arranged with seller'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: 10, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
                <span style={{ color: '#57534E' }}>{label}</span>
                <span style={{ color: '#1C1917', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #E7E5E4', marginTop: 12, paddingTop: 12,
              display: 'flex', justifyContent: 'space-between',
              fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700 }}>
              <span style={{ color: '#1C1917' }}>Total</span>
              <span style={{ color: '#2D6A4F' }}>${transaction?.price?.toFixed(2)}</span>
            </div>
          </div>

          {/* Security note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#A8A29E', margin: 0 }}>
              Your payment is secured with 256-bit SSL encryption.
            </p>
          </div>
        </div>

        {/* ── Right: Payment Form ── */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #E7E5E4',
          padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          <h2 style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600,
            color: '#1C1917', margin: '0 0 24px' }}>Payment Details</h2>

          {/* Card type indicator */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'VISA',       active: isVisa },
              { label: 'Mastercard', active: isMC   },
              { label: 'EFTPOS',     active: !isVisa && !isMC && cardDigits.length > 0 },
            ].map(({ label, active }) => (
              <div key={label} style={{ padding: '6px 14px', borderRadius: 8,
                border: active ? '2px solid #2D6A4F' : '1.5px solid #E7E5E4',
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
                color: active ? '#2D6A4F' : '#A8A29E',
                backgroundColor: active ? '#F0FAF4' : '#FAFAF8',
                transition: 'all 0.2s' }}>
                {label}
              </div>
            ))}
          </div>

          <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Card number */}
            <FormField label="Card Number" error={errors.cardNumber}>
              <input
                type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                value={form.cardNumber}
                onChange={e => set('cardNumber', formatCardNumber(e.target.value))}
                style={fieldStyle(!!errors.cardNumber)}
              />
            </FormField>

            {/* Cardholder */}
            <FormField label="Cardholder Name" error={errors.cardHolder}>
              <input
                type="text" placeholder="Full name as on card"
                value={form.cardHolder}
                onChange={e => set('cardHolder', e.target.value)}
                style={fieldStyle(!!errors.cardHolder)}
              />
            </FormField>

            {/* Expiry + CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Expiry" error={errors.expiry}>
                <input
                  type="text" inputMode="numeric" placeholder="MM/YY"
                  value={form.expiry}
                  onChange={e => set('expiry', formatExpiry(e.target.value))}
                  style={fieldStyle(!!errors.expiry)}
                />
              </FormField>
              <FormField label="CVV" error={errors.cvv}>
                <input
                  type="password" inputMode="numeric" placeholder="•••"
                  maxLength={4}
                  value={form.cvv}
                  onChange={e => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={fieldStyle(!!errors.cvv)}
                />
              </FormField>
            </div>

            <button type="submit" disabled={paying}
              style={{ marginTop: 8, padding: '15px',
                backgroundColor: paying ? '#A8A29E' : '#2D6A4F',
                color: '#FAFAF8', border: 'none', borderRadius: 14,
                fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700,
                cursor: paying ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px rgba(45,106,79,0.25)',
                transition: 'background-color 0.2s' }}
              onMouseEnter={e => { if (!paying) e.currentTarget.style.backgroundColor = '#52B788' }}
              onMouseLeave={e => { if (!paying) e.currentTarget.style.backgroundColor = '#2D6A4F' }}>
              {paying ? 'Processing…' : `Pay $${transaction?.price?.toFixed(2)}`}
            </button>

            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#A8A29E',
              textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              By clicking Pay, you agree to the BookSwap terms of service.
              This is a simulated payment for demonstration purposes.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: "'Inter', sans-serif",
        fontSize: 12, fontWeight: 700, color: '#1C1917', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11,
        color: '#DC2626', margin: '4px 0 0' }}>{error}</p>}
    </div>
  )
}

const fieldStyle = (hasError) => ({
  width: '100%', padding: '11px 14px',
  border: `1.5px solid ${hasError ? '#DC2626' : '#E7E5E4'}`,
  borderRadius: 12, fontFamily: "'Inter', sans-serif", fontSize: 14,
  color: '#1C1917', background: '#fff', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
})
