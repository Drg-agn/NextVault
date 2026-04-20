import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import axios from 'axios'

export default function Profile() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(0)
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
      const accRes = await axios.get('${process.env.NEXT_PUBLIC_API_URL}/api/accounts', { headers, withCredentials: true })
      const acc = accRes.data.accounts?.[0]
      setAccount(acc)
      if (acc) {
        const balRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${acc._id}/balance`, { headers, withCredentials: true })
        setBalance(balRes.data.balance || 0)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      })
    } catch (err) { console.error(err) }
    localStorage.clear()
    navigate('/')
  }

  // Three.js
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

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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
            <button onClick={handleLogout} style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: '1px solid rgba(240,96,96,0.3)', background: 'rgba(240,96,96,0.08)', color: '#f06060', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '2.5rem 2rem' }}>

          {/* PROFILE HEADER */}
          <div style={{ ...glass, padding: '2.5rem', marginBottom: '1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,245,196,0.1),transparent 70%)' }} />
            {/* Avatar */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#00f5c4,#7b6ef6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#03050f' }}>
              {initials}
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.4rem' }}>{user?.name}</h2>
            <p style={{ color: 'rgba(232,234,240,0.45)', fontSize: '0.9rem', marginBottom: '1rem' }}>{user?.email}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,245,196,0.08)', border: '1px solid rgba(0,245,196,0.2)', borderRadius: 100, padding: '0.3rem 1rem', fontSize: '0.78rem', color: '#00f5c4' }}>
              ● Account Active
            </div>
          </div>

          {/* BALANCE */}
          <div style={{ ...glass, padding: '1.75rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(123,110,246,0.12),transparent 70%)' }} />
            <div style={{ fontSize: '0.75rem', color: 'rgba(232,234,240,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Total Balance</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px' }}>
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* ACCOUNT DETAILS */}
          <div style={{ ...glass, padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Account Details</div>
            {[
              ['Account ID', account?._id || '—'],
              ['Currency', account?.currency || 'INR'],
              ['Status', account?.status || 'ACTIVE'],
              ['Member Since', account?.createdAt ? new Date(account.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(232,234,240,0.45)' }}>{label}</div>
                <div style={{ fontSize: '0.85rem', fontFamily: label === 'Account ID' ? 'monospace' : 'inherit', color: label === 'Status' ? '#00f5c4' : '#e8eaf0', maxWidth: 300, wordBreak: 'break-all', textAlign: 'right' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* PERSONAL INFO */}
          <div style={{ ...glass, padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Personal Information</div>
            {[
              ['Full Name', user?.name || '—'],
              ['Email Address', user?.email || '—'],
              ['User ID', user?._id || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(232,234,240,0.45)' }}>{label}</div>
                <div style={{ fontSize: '0.85rem', fontFamily: label === 'User ID' ? 'monospace' : 'inherit', color: '#e8eaf0', maxWidth: 300, wordBreak: 'break-all', textAlign: 'right' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              onClick={() => navigate('/transaction')}
              style={{ padding: '1rem', borderRadius: 12, background: '#00f5c4', border: 'none', color: '#03050f', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
            >
              ⚡ Send Money
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '1rem', borderRadius: 12, background: 'rgba(240,96,96,0.08)', border: '1px solid rgba(240,96,96,0.25)', color: '#f06060', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}