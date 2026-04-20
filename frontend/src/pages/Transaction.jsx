
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import axios from 'axios'

export default function Transaction() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(0)
  const [form, setForm] = useState({ toAccountId: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error'
  const [message, setMessage] = useState('')
  const [transactions, setTransactions] = useState([])

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const accRes = await axios.get('${process.env.NEXT_PUBLIC_API_URL}/api/accounts', { headers, withCredentials: true })
      const acc = accRes.data.accounts?.[0]
      setAccount(acc)
      if (acc) {
        const balRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${acc._id}/balance`, { headers, withCredentials: true })
        setBalance(balRes.data.balance || 0)
        const txRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${acc._id}`, { headers, withCredentials: true })
        setTransactions(txRes.data.transactions || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Three.js background
  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 30
    const count = 1800
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i*3]=(Math.random()-0.5)*120; pos[i*3+1]=(Math.random()-0.5)*120; pos[i*3+2]=(Math.random()-0.5)*80
      const t=Math.random()
      if(t<0.6){col[i*3]=0;col[i*3+1]=0.96;col[i*3+2]=0.77}
      else{col[i*3]=0.48;col[i*3+1]=0.43;col[i*3+2]=0.96}
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3))
    geo.setAttribute('color',new THREE.BufferAttribute(col,3))
    const mat=new THREE.PointsMaterial({size:0.15,vertexColors:true,transparent:true,opacity:0.4})
    const points=new THREE.Points(geo,mat)
    scene.add(points)
    const onResize=()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight)}
    window.addEventListener('resize',onResize)
    let t=0,animId
    const animate=()=>{animId=requestAnimationFrame(animate);t+=0.002;points.rotation.y=t*0.05;renderer.render(scene,camera)}
    animate()
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',onResize);renderer.dispose()}
  }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setStatus(null)
    setMessage('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!account) return
    if (form.toAccountId === account._id) {
      setStatus('error')
      setMessage('Cannot transfer to your own account.')
      return
    }
    if (Number(form.amount) <= 0) {
      setStatus('error')
      setMessage('Amount must be greater than 0.')
      return
    }
    if (Number(form.amount) > balance) {
      setStatus('error')
      setMessage('Insufficient balance.')
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const res = await axios.post(
        '${process.env.NEXT_PUBLIC_API_URL}/api/transactions',
        {
          fromAccountId: account._id,
          toAccountId: form.toAccountId,
          amount: Number(form.amount)
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      )
      setStatus('success')
      setMessage(`₹${form.amount} sent successfully!`)
      setForm({ toAccountId: '', amount: '' })
      fetchData() // refresh balance and transactions
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Transaction failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const glass = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, backdropFilter: 'blur(20px)' }

  return (
    <div style={{ background: '#03050f', minHeight: '100vh', color: '#e8eaf0', fontFamily: "'DM Sans', sans-serif" }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* NAV */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(3,5,15,0.7)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.35rem', background: 'linear-gradient(90deg,#00f5c4,#7b6ef6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NexVault</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', cursor: 'pointer' }}>
              ← Dashboard
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 2rem' }}>

          {/* PAGE TITLE */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.4rem' }}>Send Money</h1>
            <p style={{ color: 'rgba(232,234,240,0.45)', fontSize: '0.9rem' }}>Transfer funds instantly to any NexVault account</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* LEFT — FORM */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Balance Card */}
              <div style={{ ...glass, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,245,196,0.12),transparent 70%)' }} />
                <div style={{ fontSize: '0.75rem', color: 'rgba(232,234,240,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Available Balance</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>
                  ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(232,234,240,0.35)', marginTop: '0.4rem' }}>
                  From: <span style={{ color: 'rgba(232,234,240,0.6)', fontFamily: 'monospace', fontSize: '0.72rem' }}>{account?._id?.slice(0,20)}...</span>
                </div>
              </div>

              {/* Transfer Form */}
              <div style={{ ...glass, padding: '1.75rem' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Transfer Details</div>

                {/* Status Message */}
                {status && (
                  <div style={{ background: status === 'success' ? 'rgba(0,245,196,0.08)' : 'rgba(240,96,96,0.08)', border: `1px solid ${status === 'success' ? 'rgba(0,245,196,0.25)' : 'rgba(240,96,96,0.25)'}`, borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: status === 'success' ? '#00f5c4' : '#f06060', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {status === 'success' ? '✓' : '✕'} {message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* To Account */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(232,234,240,0.6)', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>Recipient Account ID</label>
                    <input
                      type="text"
                      name="toAccountId"
                      value={form.toAccountId}
                      onChange={handleChange}
                      placeholder="Paste account ID here"
                      required
                      style={{ width: '100%', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8eaf0', fontFamily: 'monospace', fontSize: '0.85rem', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,245,196,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                  {/* Amount */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(232,234,240,0.6)', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>Amount (₹)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(232,234,240,0.4)', fontSize: '1rem', fontFamily: 'Syne, sans-serif' }}>₹</span>
                      <input
                        type="number"
                        name="amount"
                        value={form.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="1"
                        required
                        style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8eaf0', fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(0,245,196,0.4)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                    {/* Quick amount buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {[500, 1000, 2000, 5000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setForm({ ...form, amount: amt.toString() })}
                          style={{ flex: 1, padding: '0.4rem', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(232,234,240,0.6)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                        >
                          ₹{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.9rem', borderRadius: 10, background: loading ? 'rgba(0,245,196,0.5)' : '#00f5c4', border: 'none', color: '#03050f', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? 'Processing...' : '⚡ Send Money'}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT — TRANSACTION HISTORY */}
            <div style={{ ...glass, padding: '1.75rem' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Transaction History</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(232,234,240,0.35)', fontFamily: 'DM Sans, sans-serif', fontWeight: 400 }}>{transactions.length} total</span>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(232,234,240,0.25)', fontSize: '0.875rem' }}>
                  No transactions yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 480, overflowY: 'auto' }}>
                  {transactions.map((tx, i) => {
                    const isCredit = tx.toAccount === account?._id
                    return (
                      <div key={tx._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: isCredit ? 'rgba(0,245,196,0.1)' : 'rgba(240,96,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0, color: isCredit ? '#00f5c4' : '#f06060' }}>
                          {isCredit ? '↓' : '↑'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{isCredit ? 'Received' : 'Sent'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(232,234,240,0.3)', marginTop: '0.15rem' }}>
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: isCredit ? '#00f5c4' : '#f06060' }}>
                            {isCredit ? '+' : '−'}₹{tx.amount?.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: tx.status === 'COMPLETED' ? 'rgba(0,245,196,0.6)' : 'rgba(240,96,96,0.6)', marginTop: '0.15rem' }}>
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}