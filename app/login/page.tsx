'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useWindowSize } from '../../lib/hooks'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Login() {
  const router = useRouter()
  const { isMobile, isTablet } = useWindowSize()
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
      const isAdmin = data.user?.email === 'admin@leadflow.com'
      router.refresh()
      router.push(isAdmin ? '/admin' : '/empresa')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Credenciales incorrectas'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const showSidebar = !isMobile && !isTablet

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* Left panel — solo en desktop */}
      {showSidebar && (
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>LeadFlow</span>
          </div>

          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
              Gestiona tus leads.<br />
              <span style={{ color: '#A5B4FC' }}>Crece más rápido.</span>
            </h2>
            <p style={{ color: '#C7D2FE', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
              Recibe solicitudes de clientes cualificados en tiempo real y gestiona tu pipeline de forma profesional.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                'Leads cualificados en tiempo real',
                'Panel de gestión profesional',
                'Sistema de cola configurable',
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span style={{ color: '#E0E7FF', fontSize: 15 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ position: 'relative', color: '#4338CA', fontSize: 13 }}>© 2026 LeadFlow · Todos los derechos reservados</p>
        </div>
      )}

      {/* Right panel — formulario */}
      <div style={{
        width: showSidebar ? 480 : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '32px 20px' : '48px',
        background: '#fff',
        minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Logo en móvil */}
          {!showSidebar && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, background: '#6366F1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 22, color: '#0F172A', letterSpacing: '-0.5px' }}>LeadFlow</span>
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 8 }}>Bienvenido</h1>
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
                placeholder="tu@empresa.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••••"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
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
              style={{ width: '100%', padding: '13px', background: loading ? '#A5B4FC' : '#6366F1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
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