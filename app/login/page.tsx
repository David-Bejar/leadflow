'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      
      // Comprobar si es admin
      const isAdmin = data.user?.email === 'admin@leadflow.com'
      router.refresh()
      router.push(isAdmin ? '/admin' : '/despacho')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Credenciales incorrectas'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* Left panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>LeadFlow</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
            Gestiona tus leads.<br />
            <span style={{ color: '#A5B4FC' }}>Crece más rápido.</span>
          </h2>
          <p style={{ color: '#C7D2FE', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
            Recibe solicitudes de clientes cualificados en tiempo real, gestiona tu pipeline y cierra más casos.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Leads cualificados en tiempo real' },
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Panel de gestión profesional' },
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Sistema de exclusividad por lead' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon}/>
                </svg>
                <span style={{ color: '#E0E7FF', fontSize: 15 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <p style={{ color: '#6366F1', fontSize: 13 }}>© 2026 LeadFlow · Todos los derechos reservados</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 8 }}>Bienvenido</h1>
            <p style={{ color: '#64748B', fontSize: 15 }}>Accede a tu panel de gestión</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="tu@despacho.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', transition: 'border 0.15s', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Contraseña</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••••"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', transition: 'border 0.15s', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#A5B4FC' : '#6366F1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: 4 }}
            >
              {loading ? 'Accediendo...' : 'Acceder al panel'}
            </button>
          </div>

          <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 28 }}>
            ¿No tienes acceso? Contacta con el administrador.
          </p>
        </div>
      </div>
    </div>
  )
}