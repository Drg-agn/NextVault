import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'

export default function Landing() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 30

    const count = 2200
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120
      pos[i * 3 + 1] = (Math.random() - 0.5) * 120
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80
      const t = Math.random()
      if (t < 0.6) { col[i*3]=0; col[i*3+1]=0.96; col[i*3+2]=0.77 }
      else { col[i*3]=0.48; col[i*3+1]=0.43; col[i*3+2]=0.96 }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 0.7 })
    const points = new THREE.Points(geo, mat)
    scene.add(points)

    const gridVerts = []
    const S = 80, step = 8
    for (let x = -S; x <= S; x += step) { gridVerts.push(x,-S,-20, x,S,-20) }
    for (let y = -S; y <= S; y += step) { gridVerts.push(-S,y,-20, S,y,-20) }
    const gridGeo = new THREE.BufferGeometry()
    gridGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridVerts), 3))
    const gridMat = new THREE.LineBasicMaterial({ color: 0x00f5c4, transparent: true, opacity: 0.04 })
    const grid = new THREE.LineSegments(gridGeo, gridMat)
    scene.add(grid)

    let mouse = { x: 0, y: 0 }
    const onMouseMove = e => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    let t = 0
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.003
      points.rotation.y = t * 0.08 + mouse.x * 0.05
      points.rotation.x = mouse.y * 0.03
      grid.rotation.z = t * 0.01
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ background: '#03050f', minHeight: '100vh', color: '#e8eaf0', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* NAV */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 3rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(3,5,15,0.6)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', background: 'linear-gradient(90deg,#00f5c4,#7b6ef6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NexVault</div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/login')} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', cursor: 'pointer' }}>Log in</button>
            <button onClick={() => navigate('/register')} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#00f5c4', border: 'none', color: '#03050f', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>Get Started</button>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '4rem 3rem', gap: '4rem', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,245,196,0.08)', border: '1px solid rgba(0,245,196,0.2)', borderRadius: 100, padding: '0.35rem 1rem', fontSize: '0.78rem', color: '#00f5c4', marginBottom: '1.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f5c4', display: 'inline-block' }} />
              Live & Secure Banking
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '1.25rem' }}>
              Bank Smarter.<br />
              <span style={{ background: 'linear-gradient(135deg,#00f5c4,#7b6ef6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Move Money</span><br />
              Instantly.
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'rgba(232,234,240,0.45)', lineHeight: 1.7, maxWidth: 480, marginBottom: '2.5rem', fontWeight: 300 }}>
              NexVault gives you a powerful digital banking experience — transfers, real-time balance tracking, and an AI assistant ready to help 24/7.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => navigate('/register')} style={{ padding: '0.85rem 2rem', borderRadius: 10, background: '#00f5c4', border: 'none', color: '#03050f', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}>Open Account</button>
              <button onClick={() => navigate('/login')} style={{ padding: '0.85rem 2rem', borderRadius: 10, background: 'transparent', color: '#e8eaf0', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', cursor: 'pointer' }}>Log In</button>
            </div>
            <div style={{ display: 'flex', gap: '2.5rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[['₹2.4B+','Transferred'],['50K+','Active Users'],['99.9%','Uptime']].map(([v,l]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(232,234,240,0.45)', marginTop: '0.2rem' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT CARDS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-end' }}>
            {/* Account Card */}
            <div style={{ width: 340, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.75rem', backdropFilter: 'blur(20px)', transform: 'perspective(800px) rotateY(-8deg) rotateX(4deg)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 36, height: 28, background: 'linear-gradient(135deg,#f0c040,#c8922a)', borderRadius: 5, marginBottom: '1.25rem' }} />
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', letterSpacing: '0.18em', color: 'rgba(232,234,240,0.45)', marginBottom: '1.5rem' }}>4829 •••• •••• 7741</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem' }}>Arka Patra</div>
                <div style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: 100, background: 'rgba(0,245,196,0.12)', color: '#00f5c4', border: '1px solid rgba(0,245,196,0.25)' }}>● ACTIVE</div>
              </div>
            </div>
            {/* Balance */}
            <div style={{ width: 340, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.25rem 1.5rem', backdropFilter: 'blur(20px)', transform: 'perspective(800px) rotateY(-8deg)' }}>
              <div style={{ fontSize: '0.78rem', color: 'rgba(232,234,240,0.45)', marginBottom: '0.4rem' }}>Total Balance</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-1px' }}>₹1,24,580.00</div>
              <div style={{ fontSize: '0.8rem', color: '#00f5c4', marginTop: '0.3rem' }}>↑ +₹3,200 this week</div>
            </div>
            {/* Transactions */}
            <div style={{ width: 340, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.25rem 1.5rem', backdropFilter: 'blur(20px)', transform: 'perspective(800px) rotateY(-8deg)' }}>
              <div style={{ fontSize: '0.78rem', color: 'rgba(232,234,240,0.45)', marginBottom: '0.85rem' }}>Recent Transactions</div>
              {[
                { label: 'Transfer Received', amt: '+₹5,000', cr: true },
                { label: 'Sent to Rahul', amt: '−₹1,800', cr: false },
                { label: 'Razorpay Top-up', amt: '+₹10,000', cr: true },
              ].map((tx, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: tx.cr ? '#00f5c4' : '#f06060', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.85rem', flex: 1 }}>{tx.label}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.88rem', fontWeight: 700, color: tx.cr ? '#00f5c4' : '#f06060' }}>{tx.amt}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 3rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#00f5c4', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>Why NexVault</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '3.5rem', maxWidth: 500, lineHeight: 1.15 }}>Everything you need. Nothing you don't.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {[
              ['⚡','Instant Transfers','Send money between accounts in real-time with full ledger tracking and idempotent transaction safety.'],
              ['🔐','JWT Auth & Security','Token-based authentication with blacklisting on logout. Your session, your control.'],
              ['📊','Live Balance','Real-time balance computed from ledger entries. Every debit and credit tracked accurately.'],
              ['💳','Razorpay Top-up','Add real money to your account securely via Razorpay. Webhooks auto-credit your balance.'],
              ['🤖','AI Assistant','Ask your balance, initiate transfers, or get help — all through a smart in-app chatbot.'],
              ['✉️','Email Notifications','Automatic emails on registration and transactions keep you informed at every step.'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem', transition: 'border-color 0.3s,transform 0.3s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,245,196,0.1)', border: '1px solid rgba(0,245,196,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', fontSize: '1.25rem' }}>{icon}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{title}</div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(232,234,240,0.45)', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 3rem 6rem' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(0,245,196,0.08),rgba(123,110,246,0.08))', border: '1px solid rgba(0,245,196,0.15)', borderRadius: 24, padding: '4rem', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '1rem' }}>Ready to move money<br />at the speed of light?</h2>
            <p style={{ color: 'rgba(232,234,240,0.45)', fontSize: '1.05rem', marginBottom: '2rem' }}>Create your account in seconds. No paperwork. No waiting.</p>
            <button onClick={() => navigate('/register')} style={{ padding: '0.85rem 2rem', borderRadius: 10, background: '#00f5c4', border: 'none', color: '#03050f', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}>Create Free Account</button>
          </div>
        </section>
      </div>
    </div>
  )
}