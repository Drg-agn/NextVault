import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as THREE from 'three'
import axios from 'axios'

export default function Login() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      pos[i * 3] = (Math.random() - 0.5) * 120
      pos[i * 3 + 1] = (Math.random() - 0.5) * 120
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80
      const t = Math.random()
      if (t < 0.6) { col[i*3]=0; col[i*3+1]=0.96; col[i*3+2]=0.77 }
      else { col[i*3]=0.48; col[i*3+1]=0.43; col[i*3+2]=0.96 }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 0.6 })
    const points = new THREE.Points(geo, mat)
    scene.add(points)

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

    let t = 0, animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.003
      points.rotation.y = t * 0.08 + mouse.x * 0.05
      points.rotation.x = mouse.y * 0.03
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

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(
        '${process.env.NEXT_PUBLIC_API_URL}/api/auth/login',
        form,
        { withCredentials: true }
      )
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#03050f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

      {/* CARD */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 420, padding: '0 1.5rem' }}>

        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', background: 'linear-gradient(90deg,#00f5c4,#7b6ef6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', marginBottom: '2rem', cursor: 'pointer' }}>
          NexVault
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '2.5rem', backdropFilter: 'blur(20px)' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>Welcome back</h2>
          <p style={{ color: 'rgba(232,234,240,0.45)', fontSize: '0.9rem', marginBottom: '2rem' }}>Log in to your NexVault account</p>

          {error && (
            <div style={{ background: 'rgba(240,96,96,0.1)', border: '1px solid rgba(240,96,96,0.25)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f06060', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(232,234,240,0.6)', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                style={{ width: '100%', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,245,196,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(232,234,240,0.6)', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8eaf0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,245,196,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.9rem', borderRadius: 10, background: loading ? 'rgba(0,245,196,0.5)' : '#00f5c4', border: 'none', color: '#03050f', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'rgba(232,234,240,0.45)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#00f5c4', textDecoration: 'none', fontWeight: 500 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}