import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const IDENTITY_OPTIONS = [
    { value: '', label: '请选择身份' },
    { value: '学生', label: '学生' },
    { value: '教职工', label: '教职工' },
    { value: '校友', label: '校友' },
    { value: '其他', label: '其他' },
]

export default function Profile() {
    const { id } = useParams()
    const { user, updateUser } = useAuth()
    const navigate = useNavigate()
    const isOwnProfile = !id || id === user?.id
    const avatarInputRef = useRef(null)

    const [profile, setProfile] = useState(null)
    const [reviews, setReviews] = useState([])
    const [transactions, setTransactions] = useState([])
    const [tab, setTab] = useState('info')
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ bio: '', contactInfo: '', campus: '', major: '', avatar: '', identity: '', region: '' })
    const [saving, setSaving] = useState(false)
    const [avatarUploading, setAvatarUploading] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (isOwnProfile) {
                    const { data } = await api.get('/auth/profile')
                    setProfile(data)
                    setForm({
                        bio: data.bio || '', contactInfo: data.contactInfo || '',
                        campus: data.campus || '', major: data.major || '',
                        avatar: data.avatar || '', identity: data.identity || '',
                        region: data.region || ''
                    })
                } else {
                    const { data } = await api.get(`/auth/users/${id}`)
                    setProfile(data)
                }
            } catch {
                toast.error('无法加载用户资料')
            }
        }
        if (!isOwnProfile || user) fetchProfile()
    }, [id, isOwnProfile, user])

    useEffect(() => {
        const uid = isOwnProfile ? user?.id : id
        if (!uid) return
        api.get(`/reviews/user/${uid}`).then(({ data }) => setReviews(data)).catch(() => { })
        if (isOwnProfile) {
            api.get('/transactions/my').then(({ data }) => setTransactions(data)).catch(() => { })
        }
    }, [id, isOwnProfile, user])

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setAvatarUploading(true)
        try {
            const fd = new FormData()
            fd.append('images', file)
            const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setForm(f => ({ ...f, avatar: data.urls[0] }))
        } catch {
            toast.error('头像上传失败')
        } finally {
            setAvatarUploading(false)
            e.target.value = ''
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data } = await api.patch('/auth/profile', form)
            setProfile(data)
            updateUser({
                bio: data.bio, contactInfo: data.contactInfo,
                campus: data.campus, major: data.major, avatar: data.avatar,
                identity: data.identity, region: data.region
            })
            setEditing(false)
            toast.success('资料已更新')
        } catch {
            toast.error('保存失败')
        } finally {
            setSaving(false)
        }
    }

    const renderStars = (rating) => {
        return [1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ color: i <= Math.round(rating) ? '#F59E0B' : '#D1D5DB', fontSize: 16 }}>★</span>
        ))
    }

    const inputStyle = {
        width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #E7E5E4',
        fontSize: 14, color: '#1C1917', boxSizing: 'border-box', outline: 'none', background: '#fff'
    }
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#57534E', marginBottom: 6 }
    const starStyle = { color: '#EF4444', marginLeft: 2, fontSize: 12 }
    const hintStyle = { fontSize: 11, color: '#A8A29E', marginLeft: 4 }

    if (!profile) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <p style={{ color: '#78716C', fontFamily: "'Inter', sans-serif" }}>加载中...</p>
        </div>
    )

    return (
        <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px', fontFamily: "'Inter', sans-serif" }}>
            {/* 头部卡片 */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4', padding: 28, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', backgroundColor: '#2D6A4F',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, color: '#fff', fontWeight: 700, flexShrink: 0, overflow: 'hidden'
                    }}>
                        {profile.avatar
                            ? <img src={profile.avatar} alt="avatar"
                                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                            : profile.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1C1917' }}>{profile.username}</h2>
                        {(profile.identity || profile.campus || profile.major) && (
                            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#78716C' }}>
                                {[profile.identity, profile.campus, profile.major].filter(Boolean).join(' · ')}
                            </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            {renderStars(profile.rating)}
                            <span style={{ fontSize: 14, color: '#57534E' }}>
                                {profile.rating > 0 ? `${profile.rating} (${profile.reviewCount} 条评价)` : '暂无评价'}
                            </span>
                        </div>
                    </div>
                    {isOwnProfile && (
                        <button onClick={() => setEditing(!editing)}
                            style={{
                                padding: '8px 18px', borderRadius: 10, border: '1px solid #E7E5E4',
                                background: editing ? '#F0FDF4' : '#fff', color: '#2D6A4F',
                                fontSize: 14, fontWeight: 500, cursor: 'pointer'
                            }}>
                            {editing ? '取消' : '编辑资料'}
                        </button>
                    )}
                </div>
                {profile.bio && !editing && (
                    <p style={{ marginTop: 16, fontSize: 14, color: '#57534E', lineHeight: 1.6 }}>{profile.bio}</p>
                )}
            </div>

            {/* 编辑表单 */}
            {editing && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4', padding: 24, marginBottom: 20 }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#1C1917' }}>编辑个人资料</h3>

                    {/* 头像上传 */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>头像</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%', backgroundColor: '#2D6A4F',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 24, color: '#fff', fontWeight: 700, flexShrink: 0, overflow: 'hidden'
                            }}>
                                {form.avatar
                                    ? <img src={form.avatar} alt="preview"
                                        style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                                    : profile.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <input ref={avatarInputRef} type="file" accept="image/*"
                                    style={{ display: 'none' }} onChange={handleAvatarUpload} />
                                <button onClick={() => avatarInputRef.current?.click()}
                                    disabled={avatarUploading}
                                    style={{
                                        padding: '7px 16px', borderRadius: 10, border: '1px solid #E7E5E4',
                                        background: '#fff', color: '#2D6A4F', fontSize: 13, fontWeight: 500,
                                        cursor: avatarUploading ? 'not-allowed' : 'pointer'
                                    }}>
                                    {avatarUploading ? '上传中...' : '上传图片'}
                                </button>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#A8A29E' }}>支持 JPG、PNG，最大 5MB</p>
                            </div>
                        </div>
                    </div>

                    {/* 身份 */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>身份</label>
                        <select value={form.identity} onChange={e => setForm(f => ({ ...f, identity: e.target.value }))}
                            style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2378716C' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}>
                            {IDENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    {/* 所在地区（推荐） */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>
                            所在地区<span style={starStyle}>*</span>
                            <span style={hintStyle}>推荐填写</span>
                        </label>
                        <input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                            placeholder="如：广州市天河区" style={inputStyle} />
                    </div>

                    {/* 联系电话（推荐） */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>
                            联系电话<span style={starStyle}>*</span>
                            <span style={hintStyle}>推荐补充，方便买家联系你</span>
                        </label>
                        <input value={form.contactInfo} onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))}
                            placeholder="手机号 / 微信号" style={inputStyle} />
                    </div>

                    {/* 校区（选填） */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>
                            所在校区
                            <span style={hintStyle}>选填</span>
                        </label>
                        <input value={form.campus} onChange={e => setForm(f => ({ ...f, campus: e.target.value }))}
                            placeholder="如：北校区" style={inputStyle} />
                    </div>

                    {/* 专业（选填） */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>
                            专业
                            <span style={hintStyle}>选填</span>
                        </label>
                        <input value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))}
                            placeholder="如：计算机科学" style={inputStyle} />
                    </div>

                    {/* 个人简介 */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>个人简介</label>
                        <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            rows={3} placeholder="介绍一下自己..."
                            style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        style={{
                            padding: '9px 24px', borderRadius: 10, border: 'none',
                            background: '#2D6A4F', color: '#fff', fontSize: 14, fontWeight: 600,
                            cursor: saving ? 'not-allowed' : 'pointer'
                        }}>
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            )}

            {/* Tab 切换 */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[
                    { key: 'info', label: '基本信息' },
                    { key: 'reviews', label: `评价 (${reviews.length})` },
                    ...(isOwnProfile ? [{ key: 'transactions', label: `交易记录 (${transactions.length})` }] : []),
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        style={{
                            padding: '8px 18px', borderRadius: 10, border: '1px solid',
                            borderColor: tab === t.key ? '#2D6A4F' : '#E7E5E4',
                            background: tab === t.key ? '#F0FDF4' : '#fff',
                            color: tab === t.key ? '#2D6A4F' : '#57534E',
                            fontSize: 14, fontWeight: 500, cursor: 'pointer'
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 基本信息 */}
            {tab === 'info' && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4', padding: 24 }}>
                    {[
                        { label: '身份', value: profile.identity },
                        { label: '所在地区', value: profile.region },
                        { label: '校区', value: profile.campus },
                        { label: '专业', value: profile.major },
                        { label: '联系方式', value: isOwnProfile ? profile.contactInfo : (profile.contactInfo ? '已填写' : '未公开') },
                        { label: '简介', value: profile.bio },
                        { label: '加入时间', value: new Date(profile.createdAt).toLocaleDateString('zh-CN') },
                    ].map(({ label, value }) => value ? (
                        <div key={label} style={{
                            display: 'flex', gap: 16, padding: '12px 0',
                            borderBottom: '1px solid #F5F5F4'
                        }}>
                            <span style={{ fontSize: 14, color: '#78716C', width: 80, flexShrink: 0 }}>{label}</span>
                            <span style={{ fontSize: 14, color: '#1C1917' }}>{value}</span>
                        </div>
                    ) : null)}
                </div>
            )}

            {/* 评价列表 */}
            {tab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reviews.length === 0 ? (
                        <div style={{
                            background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
                            padding: 40, textAlign: 'center', color: '#78716C', fontSize: 14
                        }}>
                            暂无评价
                        </div>
                    ) : reviews.map(r => (
                        <div key={r._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4', padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%', backgroundColor: '#2D6A4F',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, color: '#fff', fontWeight: 700
                                    }}>
                                        {r.reviewer?.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>{r.reviewer?.username}</span>
                                        <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                            {renderStars(r.rating)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 12, color: '#78716C' }}>
                                        {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                                    </span>
                                    <br />
                                    <span style={{
                                        fontSize: 12, padding: '2px 8px', borderRadius: 6,
                                        background: r.type === 'seller' ? '#F0FDF4' : '#EFF6FF',
                                        color: r.type === 'seller' ? '#2D6A4F' : '#2563EB'
                                    }}>
                                        {r.type === 'seller' ? '作为卖家' : '作为买家'}
                                    </span>
                                </div>
                            </div>
                            {r.comment && (
                                <p style={{ margin: '12px 0 0', fontSize: 14, color: '#57534E', lineHeight: 1.6 }}>{r.comment}</p>
                            )}
                            {r.listing?.title && (
                                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#A8A29E' }}>
                                    书目：{r.listing.title}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 交易记录（仅自己） */}
            {tab === 'transactions' && isOwnProfile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {transactions.length === 0 ? (
                        <div style={{
                            background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4',
                            padding: 40, textAlign: 'center', color: '#78716C', fontSize: 14
                        }}>
                            暂无交易记录
                        </div>
                    ) : transactions.map(t => {
                        const isBuyer = t.buyer?._id === user?.id || t.buyer === user?.id
                        const statusMap = { pending: '待确认', confirmed: '已确认', completed: '已完成', cancelled: '已取消' }
                        const statusColor = { pending: '#F59E0B', confirmed: '#3B82F6', completed: '#2D6A4F', cancelled: '#EF4444' }
                        return (
                            <div key={t._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E7E5E4', padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1C1917' }}>
                                            {t.listing?.title || '已删除书目'}
                                        </p>
                                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78716C' }}>
                                            {isBuyer ? `向 ${t.seller?.username} 购买` : `卖给 ${t.buyer?.username}`}
                                            {' · '}¥{t.price}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: statusColor[t.status] }}>
                                            {statusMap[t.status]}
                                        </span>
                                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#A8A29E' }}>
                                            {new Date(t.createdAt).toLocaleDateString('zh-CN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
