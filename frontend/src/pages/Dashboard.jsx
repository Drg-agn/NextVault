import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import axios from 'axios'

export default function Dashboard() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    const u = JSON.parse(localStorage.getItem('user'))
    setUser(u)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const accRes = await axios.get('http://localhost:3000/api/accounts', { headers, withCredentials: true })
      const acc = accRes.data.accounts?.[0]
      setAccount(acc)
      if (acc) {
        const balRes = await axios.get(`http://localhost:3000/api/accounts/${acc._id}/balance`, { headers, withCredentials: true })
        setBalance(balRes.data.balance || 0)
        const txRes = await axios.get(`http://localhost:3000/api/transactions/${acc._id}`, { headers, withCredentials: true })
        setTransactions(txRes.data.transactions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3000/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      })
    } catch (err) { console.error(err) }
    localStorage.clear()
    navigate('/')
  }

  const handleAddMoney = async () => {
    if (!addAmount || Number(addAmount) <= 0) return
    setAddLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const orderRes = await axios.post(
        'http://localhost:3000/api/razorpay/create-order',
        { amount: Number(addAmount), accountId: account._id },
        { headers, withCredentials: true }
      )

      const { orderId, amount, currency, keyId } = orderRes.data

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'NexVault',
        description: 'Add Money to Account',
        order_id: orderId,
        handler: async function (response) {
          try {
            await axios.post(
              'http://localhost:3000/api/razorpay/verify-payment',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                accountId: account._id,
                amount
              },
              { headers, withCredentials: true }
            )
            setShowAddMoney(false)
            setAddAmount('')
            fetchData()
            alert('✅ Money added successfully!')
          } catch (err) {
            alert('❌ Payment verification failed!')
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: { color: '#00f5c4' }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error(err)
      alert('Failed to create order. Try again.')
    } finally {
      setAddLoading(false)
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

  const glass = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, backdropFilter: 'blur(20px)' }

  return (
    <div style={{ background: '#03050f', minHeight: '100vh', color: '#e8eaf0', fontFamily: "'DM Sans', sans-serif" }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

      {/* ADD MONEY MODAL */}
      {showAddMoney && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2rem', width: 380, position: 'relative' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem' }}>Add Money</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(232,234,240,0.45)', marginBottom: '1.5rem' }}>Powered by Razorpay — secure payments</p>
            <input
              type="number"
              value={addAmount}
              onChange={e => setAddAmount(e.target.value)}
              placeholder="Enter amount in ₹"
              min="1"
              style={{ width: '100%', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', outline: 'none', marginBottom: '1rem' }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,245,196,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[500, 1000, 2000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAddAmount(amt.toString())}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 8, background: addAmount == amt ? 'rgba(0,245,196,0.15)' : 'rgba(255,255,255,0.04)', border: addAmount == amt ? '1px solid rgba(0,245,196,0.4)' : '1px solid rgba(255,255,255,0.08)', color: addAmount == amt ? '#00f5c4' : 'rgba(232,234,240,0.6)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setShowAddMoney(false); setAddAmount('') }}
                style={{ flex: 1, padding: '0.85rem', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eaf0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMoney}
                disabled={addLoading || !addAmount}
                style={{ flex: 1, padding: '0.85rem', borderRadius: 10, background: addLoading || !addAmount ? 'rgba(0,245,196,0.4)' : '#00f5c4', border: 'none', color: '#03050f', fontWeight: 600, cursor: addLoading || !addAmount ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem' }}
              >
                {addLoading ? 'Processing...' : '💳 Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* NAV */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(3,5,15,0.7)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.35rem', background: 'linear-gradient(90deg,#00f5c4,#7b6ef6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NexVault</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'rgba(232,234,240,0.6)' }}>
              Hey, <span style={{ color: '#e8eaf0', fontWeight: 500 }}>{user?.name}</span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: '1px solid rgba(240,96,96,0.3)', background: 'rgba(240,96,96,0.08)', color: '#f06060', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(232,234,240,0.4)', fontSize: '1rem' }}>
              Loading your account...
            </div>
          ) : (
            <>
              {/* TOP STATS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>

                {/* Balance Card */}
                <div style={{ ...glass, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,245,196,0.12),transparent 70%)' }} />
                  <div style={{ fontSize: '0.78rem', color: 'rgba(232,234,240,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Total Balance</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.5rem' }}>
                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#00f5c4' }}>● Account Active</div>
                </div>

                {/* Account Info */}
                <div style={{ ...glass, padding: '1.75rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(232,234,240,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Account ID</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', wordBreak: 'break-all', color: 'rgba(232,234,240,0.7)' }}>
                    {account?._id || 'No account found'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(232,234,240,0.4)', marginTop: '0.5rem' }}>
                    Currency: <span style={{ color: '#e8eaf0' }}>{account?.currency || 'INR'}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ ...glass, padding: '1.75rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(232,234,240,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>Quick Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      onClick={() => navigate('/transaction')}
                      style={{ padding: '0.7rem', borderRadius: 10, background: '#00f5c4', border: 'none', color: '#03050f', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ⚡ Send Money
                    </button>
                    <button
                      onClick={() => setShowAddMoney(true)}
                      style={{ padding: '0.7rem', borderRadius: 10, background: 'rgba(123,110,246,0.15)', border: '1px solid rgba(123,110,246,0.3)', color: '#7b6ef6', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      💳 Add Money
                    </button>
                    <button
                      onClick={fetchData}
                      style={{ padding: '0.7rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* ACCOUNT CARD */}
              <div style={{ ...glass, padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg,rgba(0,245,196,0.06),rgba(123,110,246,0.06))', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(123,110,246,0.1),transparent 70%)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(232,234,240,0.45)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Card Holder</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800 }}>{user?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(232,234,240,0.5)', marginTop: '0.25rem' }}>{user?.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ width: 48, height: 36, background: 'linear-gradient(135deg,#f0c040,#c8922a)', borderRadius: 6, marginBottom: '0.75rem', marginLeft: 'auto' }} />
                    <div style={{ fontSize: '0.72rem', padding: '0.3rem 0.8rem', borderRadius: 100, background: 'rgba(0,245,196,0.12)', color: '#00f5c4', border: '1px solid rgba(0,245,196,0.25)', display: 'inline-block' }}>
                      ● {account?.status || 'ACTIVE'}
                    </div>
                  </div>
                </div>
              </div>

              {/* TRANSACTIONS */}
              <div style={{ ...glass, padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>Recent Transactions</div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(232,234,240,0.4)' }}>{transactions.length} total</div>
                    <button
                      onClick={() => navigate('/transaction')}
                      style={{ padding: '0.35rem 0.85rem', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(232,234,240,0.6)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      View All
                    </button>
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(232,234,240,0.3)', fontSize: '0.9rem' }}>
                    No transactions yet. Add money or send to get started!
                  </div>
                ) : (
                  transactions.slice(0, 8).map((tx, i) => {
                    const isCredit = tx.toAccount === account?._id
                    return (
                      <div key={tx._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: i < Math.min(transactions.length, 8) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: isCredit ? 'rgba(0,245,196,0.1)' : 'rgba(240,96,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: isCredit ? '#00f5c4' : '#f06060' }}>
                          {isCredit ? '↓' : '↑'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                            {tx.fromAccount === tx.toAccount ? 'Added via Razorpay' : isCredit ? 'Money Received' : 'Money Sent'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(232,234,240,0.35)' }}>
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: isCredit ? '#00f5c4' : '#f06060' }}>
                          {isCredit ? '+' : '−'}₹{tx.amount?.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 100, background: tx.status === 'COMPLETED' ? 'rgba(0,245,196,0.1)' : 'rgba(240,96,96,0.1)', color: tx.status === 'COMPLETED' ? '#00f5c4' : '#f06060' }}>
                          {tx.status}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}