'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useWindowSize } from '../../lib/hooks'

const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  category: string
  subcategory: string
  location: string
  status: string
  assigned_despachos: string[]
  created_at: string
  description: string
}

type Despacho = {
  id: string
  name: string
  email: string
  categories: string[]
  location: string
  active: boolean
  user_id: string | null
  max_leads_activos: number
  activos: number
  total_leads: number
  cerrados: number
}

type Stats = {
  totals: {
    leads: number
    nuevos: number
    gestionados: number
    conversion: number
    despachos: number
    activos: number
  }
  byCategory: { cat: string; total: number; won: number }[]
  byStatus: { status: string; label: string; count: number }[]
  last7: { date: string; count: number }[]
  leads: Lead[]
  despachos: Despacho[]
}

const CAT_COLORS: Record<string, string> = {
  Jurídico: '#6366F1', Inmobiliario: '#0EA5E9', Reformas: '#F97316', Seguros: '#10B981',
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  new:         { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  distributed: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
  contacted:   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  in_progress: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  closed_won:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' },
  closed_lost: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
}

const STATUS_LABELS_PIPELINE: Record<string, string> = {
  new: 'Nuevo', distributed: 'Distribuido', contacted: 'Contactado',
  in_progress: 'En progreso', closed_won: 'Cerrado ganado', closed_lost: 'Cerrado perdido',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function CatBadge({ cat }: { cat: string }) {
  const color = CAT_COLORS[cat] ?? '#6366F1'
  return <span style={{ padding: '2px 10px', borderRadius: 20, background: color + '12', color, fontSize: 11, fontWeight: 600 }}>{cat}</span>
}

const NAV = [
  { id: 'overview', label: 'Resumen', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'leads', label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'empresas', label: 'Empresas', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { id: 'suscripciones', label: 'Suscripciones', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
]

export default function AdminPanel() {
  const { isMobile, isTablet } = useWindowSize()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('overview')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [editingLimite, setEditingLimite] = useState<string | null>(null)
  const [nuevoLimite, setNuevoLimite] = useState<number>(5)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const isCompact = isMobile || isTablet

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true)
    const data = await fetch('/api/admin/stats').then(r => r.json())
    setStats(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  async function toggleEmpresa(id: string, active: boolean) {
    await fetch(`/api/despachos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    })
    loadStats()
  }

  async function updateLimite(id: string, limite: number) {
    await fetch(`/api/despachos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_leads_activos: limite })
    })
    setEditingLimite(null)
    loadStats()
  }

  const filteredLeads = (stats?.leads ?? []).filter(l =>
    !search || `${l.name} ${l.email} ${l.location} ${l.category}`.toLowerCase().includes(search.toLowerCase())
  )

  const maxBar = Math.max(...(stats?.last7.map(d => d.count) ?? [1]), 1)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>

      {/* Overlay móvil */}
      {isCompact && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
      )}

      {/* Sidebar desktop */}
      {!isCompact && (
        <div style={{ width: 240, background: '#fff', borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, background: '#6366F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>LeadFlow</span>
                <span style={{ display: 'block', fontSize: 11, color: '#94A3B8' }}>Administración</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '12px', flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 8 }}>Navegación</p>
            {NAV.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)}
                style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: section === item.id ? 600 : 400, background: section === item.id ? '#EEF2FF' : 'transparent', color: section === item.id ? '#6366F1' : '#64748B', marginBottom: 2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid #F1F5F9' }}>
            <button onClick={handleLogout}
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: '#94A3B8', fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Sidebar móvil deslizable */}
      {isCompact && (
        <div style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-280px', width: 280, height: '100vh', background: '#fff', borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', zIndex: 50, transition: 'left 0.25s ease', boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, background: '#6366F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>LeadFlow</span>
                <span style={{ display: 'block', fontSize: 11, color: '#94A3B8' }}>Administración</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20 }}>✕</button>
          </div>
          <div style={{ padding: '12px', flex: 1 }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false) }}
                style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: section === item.id ? 600 : 400, background: section === item.id ? '#EEF2FF' : 'transparent', color: section === item.id ? '#6366F1' : '#64748B', marginBottom: 4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid #F1F5F9' }}>
            <button onClick={handleLogout}
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: '#94A3B8', fontSize: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: isCompact ? '12px 16px' : '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isCompact && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: isCompact ? 16 : 20, fontWeight: 800, color: '#0F172A' }}>
                {NAV.find(n => n.id === section)?.label}
              </h1>
              {!isMobile && <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>}
            </div>
          </div>
          <button onClick={loadStats}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isCompact ? '7px 10px' : '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            {!isMobile && 'Actualizar'}
          </button>
        </div>

        <div style={{ padding: isCompact ? '16px' : '24px 28px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: 100, background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9' }} />)}
            </div>
          ) : !stats ? null : (
            <>
              {/* OVERVIEW */}
              {section === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
                    {[
                      { label: 'Total leads', val: stats.totals.leads, sub: 'recibidos', color: '#6366F1', bg: '#EEF2FF', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                      { label: 'Asignaciones', val: stats.totals.gestionados, sub: 'activas', color: '#0EA5E9', bg: '#F0F9FF', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
                      { label: 'Conversión', val: `${stats.totals.conversion}%`, sub: 'tasa', color: '#10B981', bg: '#ECFDF5', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                      { label: 'Empresas activas', val: stats.totals.activos, sub: `de ${stats.totals.despachos}`, color: '#8B5CF6', bg: '#F5F3FF', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: isMobile ? 10 : 14, padding: isMobile ? '14px' : '20px' }}>
                        <div style={{ width: 36, height: 36, background: s.bg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
                        </div>
                        <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#0F172A', lineHeight: 1, marginBottom: 2 }}>{s.val}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{s.label}</div>
                        {!isMobile && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{s.sub}</div>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Leads últimos 7 días</h3>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Nuevos formularios recibidos</p>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                        {stats.last7.map((d, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: d.count > 0 ? '#6366F1' : '#E2E8F0' }}>{d.count}</span>
                            <div style={{ width: '100%', background: d.count > 0 ? '#6366F1' : '#F1F5F9', borderRadius: '3px 3px 0 0', height: `${Math.max((d.count / maxBar) * 70, 4)}px` }} />
                            <span style={{ fontSize: 9, color: '#94A3B8', whiteSpace: 'nowrap' }}>{d.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Por categoría</h3>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Distribución de leads</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stats.byCategory.map(b => {
                          const color = CAT_COLORS[b.cat] ?? '#6366F1'
                          const pct = stats.totals.leads > 0 ? Math.round((b.total / stats.totals.leads) * 100) : 0
                          return (
                            <div key={b.cat}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{b.cat}</span>
                                <span style={{ fontSize: 12, color: '#64748B' }}>{b.total} · {pct}%</span>
                              </div>
                              <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Pipeline por estado</h3>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Estado de todas las asignaciones</p>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: 10 }}>
                      {stats.byStatus.map(s => {
                        const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.new
                        return (
                          <div key={s.status} style={{ textAlign: 'center', padding: '12px 8px', background: sc.bg, borderRadius: 10, border: `1px solid ${sc.border}` }}>
                            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: sc.text, marginBottom: 3 }}>{s.count}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: sc.text }}>{s.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* LEADS */}
              {section === 'leads' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lead..."
                      style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                      onFocus={e => e.target.style.borderColor = '#6366F1'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>

                  {isMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filteredLeads.map(lead => (
                        <div key={lead.id} onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                          style={{ background: '#fff', border: `1.5px solid ${selectedLead?.id === lead.id ? '#6366F1' : '#F1F5F9'}`, borderRadius: 12, padding: '14px', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{lead.name}</span>
                            <CatBadge cat={lead.category} />
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>{lead.location} · {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                {['ID', 'Nombre', 'Categoría', 'Localización', 'Empresas', 'Fecha', ''].map(h => (
                                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredLeads.map(lead => (
                                <tr key={lead.id} onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                                  style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', background: selectedLead?.id === lead.id ? '#F8FAFF' : '#fff' }}>
                                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#6366F1', fontWeight: 600 }}>{lead.id}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{lead.name}</td>
                                  <td style={{ padding: '12px 16px' }}><CatBadge cat={lead.category} /></td>
                                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{lead.location}</td>
                                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{lead.assigned_despachos?.length ?? 0}</td>
                                  <td style={{ padding: '12px 16px', color: '#94A3B8', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(lead.created_at)}</td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {filteredLeads.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: 14 }}>No se encontraron leads</div>
                          )}
                        </div>
                      </div>

                      {selectedLead && (
                        <div style={{ width: 320, background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px', flexShrink: 0, height: 'fit-content', position: 'sticky', top: 80 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', fontWeight: 600 }}>{selectedLead.id}</span>
                            <button onClick={() => setSelectedLead(null)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{selectedLead.name}</h3>
                          <CatBadge cat={selectedLead.category} />
                          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
                            {[['Teléfono', selectedLead.phone], ['Email', selectedLead.email], ['Localización', selectedLead.location], ['Subcategoría', selectedLead.subcategory], ['Recibido', fmtDate(selectedLead.created_at)]].map(([label, value]) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F8FAFC', fontSize: 13 }}>
                                <span style={{ color: '#94A3B8' }}>{label}</span>
                                <span style={{ color: '#0F172A', fontWeight: 500, textAlign: 'right', maxWidth: 160, fontSize: 12 }}>{value}</span>
                              </div>
                            ))}
                          </div>
                          {selectedLead.description && (
                            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px', marginTop: 12, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{selectedLead.description}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detalle móvil como bottom sheet */}
                  {isMobile && selectedLead && (
                    <>
                      <div onClick={() => setSelectedLead(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
                      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '16px 16px 0 0', zIndex: 50, maxHeight: '80vh', overflowY: 'auto', padding: '20px', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{selectedLead.id}</span>
                          <button onClick={() => setSelectedLead(null)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{selectedLead.name}</h3>
                        <CatBadge cat={selectedLead.category} />
                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
                          {[['Teléfono', selectedLead.phone], ['Email', selectedLead.email], ['Localización', selectedLead.location], ['Recibido', fmtDate(selectedLead.created_at)]].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F8FAFC', fontSize: 13 }}>
                              <span style={{ color: '#94A3B8' }}>{label}</span>
                              <span style={{ color: '#0F172A', fontWeight: 500 }}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* EMPRESAS */}
              {section === 'empresas' && (
                isMobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.despachos.map(d => (
                      <div key={d.id} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 12, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{d.name}</div>
                            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{d.location}</div>
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: d.active ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${d.active ? '#A7F3D0' : '#E2E8F0'}`, fontSize: 11, fontWeight: 600, color: d.active ? '#065F46' : '#94A3B8' }}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: d.active ? '#10B981' : '#CBD5E1' }} />
                            {d.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                          {d.categories.map(c => <CatBadge key={c} cat={c} />)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            Cola: <strong>{d.activos}/{d.max_leads_activos || 5}</strong> · Cerrados: <strong style={{ color: '#059669' }}>{d.cerrados}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {editingLimite === d.id ? (
                              <>
                                <input type="number" min={1} max={50} value={nuevoLimite} onChange={e => setNuevoLimite(parseInt(e.target.value))}
                                  style={{ width: 50, padding: '4px 6px', borderRadius: 6, border: '1.5px solid #6366F1', fontSize: 13, outline: 'none', textAlign: 'center' }} />
                                <button onClick={() => updateLimite(d.id, nuevoLimite)} style={{ padding: '4px 8px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✓</button>
                                <button onClick={() => setEditingLimite(null)} style={{ padding: '4px 8px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
                              </>
                            ) : (
                              <button onClick={() => { setEditingLimite(d.id); setNuevoLimite(d.max_leads_activos || 5) }}
                                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 11, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                Límite: {d.max_leads_activos || 5}
                              </button>
                            )}
                            <button onClick={() => toggleEmpresa(d.id, !d.active)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, fontWeight: 600, color: d.active ? '#EF4444' : '#059669', cursor: 'pointer' }}>
                              {d.active ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          {['Empresa', 'Especialidades', 'Cola', 'Límite', 'Cerrados', 'Estado', 'Acciones'].map(h => (
                            <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.despachos.map(d => (
                          <tr key={d.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 700, color: '#0F172A' }}>{d.name}</div>
                              {d.email && <div style={{ fontSize: 12, color: '#94A3B8' }}>{d.email}</div>}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {d.categories.map(c => <CatBadge key={c} cat={c} />)}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 50, height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min((d.activos / (d.max_leads_activos || 5)) * 100, 100)}%`, background: d.activos >= (d.max_leads_activos || 5) ? '#EF4444' : '#10B981', borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: d.activos >= (d.max_leads_activos || 5) ? '#EF4444' : '#64748B' }}>{d.activos}/{d.max_leads_activos || 5}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              {editingLimite === d.id ? (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <input type="number" min={1} max={50} value={nuevoLimite} onChange={e => setNuevoLimite(parseInt(e.target.value))}
                                    style={{ width: 56, padding: '4px 8px', borderRadius: 6, border: '1.5px solid #6366F1', fontSize: 13, outline: 'none', textAlign: 'center' }} />
                                  <button onClick={() => updateLimite(d.id, nuevoLimite)} style={{ padding: '4px 10px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓</button>
                                  <button onClick={() => setEditingLimite(null)} style={{ padding: '4px 8px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
                                </div>
                              ) : (
                                <button onClick={() => { setEditingLimite(d.id); setNuevoLimite(d.max_leads_activos || 5) }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                  {d.max_leads_activos || 5} leads
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                              )}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#059669' }}>{d.cerrados}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: d.active ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${d.active ? '#A7F3D0' : '#E2E8F0'}`, fontSize: 11, fontWeight: 600, color: d.active ? '#065F46' : '#94A3B8' }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: d.active ? '#10B981' : '#CBD5E1' }} />
                                {d.active ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <button onClick={() => toggleEmpresa(d.id, !d.active)}
                                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 600, color: d.active ? '#EF4444' : '#059669', cursor: 'pointer' }}>
                                {d.active ? 'Desactivar' : 'Activar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* SUSCRIPCIONES */}
              {section === 'suscripciones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12 }}>
                    {[
                      { label: 'MRR estimado', val: `${stats.despachos.filter(d => d.active).reduce((acc, d) => acc + (d.max_leads_activos <= 3 ? 49 : d.max_leads_activos <= 5 ? 99 : 199), 0)}€`, sub: 'ingresos mensuales', color: '#10B981', bg: '#ECFDF5' },
                      { label: 'Asignaciones', val: stats.totals.gestionados, sub: 'lead-empresa activas', color: '#6366F1', bg: '#EEF2FF' },
                      { label: 'Empresas activas', val: stats.totals.activos, sub: 'con suscripción', color: '#8B5CF6', bg: '#F5F3FF' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                        <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Planes y facturación</h3>
                        <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>Integración Stripe próximamente</p>
                      </div>
                      <span style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>Stripe pendiente</span>
                    </div>

                    {isMobile ? (
                      <div style={{ padding: '12px' }}>
                        {stats.despachos.map(d => {
                          const planIdx = d.max_leads_activos <= 3 ? 0 : d.max_leads_activos <= 5 ? 1 : 2
                          const plans = ['Básico', 'Profesional', 'Enterprise']
                          const prices = ['49€/mes', '99€/mes', '199€/mes']
                          const planColors = ['#64748B', '#6366F1', '#F59E0B']
                          return (
                            <div key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid #F8FAFC' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{d.name}</span>
                                <span style={{ padding: '2px 8px', borderRadius: 20, background: planColors[planIdx] + '15', color: planColors[planIdx], fontSize: 11, fontWeight: 600 }}>{plans[planIdx]}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
                                <span>{prices[planIdx]} · {d.max_leads_activos} leads</span>
                                <span style={{ color: d.active ? '#059669' : '#EF4444', fontWeight: 600 }}>{d.active ? 'Al día' : 'Pendiente'}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                            {['Empresa', 'Plan', 'Límite leads', 'Cola activa', 'Cerrados', 'Estado'].map(h => (
                              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.despachos.map(d => {
                            const planIdx = d.max_leads_activos <= 3 ? 0 : d.max_leads_activos <= 5 ? 1 : 2
                            const plans = ['Básico', 'Profesional', 'Enterprise']
                            const planColors = ['#64748B', '#6366F1', '#F59E0B']
                            return (
                              <tr key={d.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{d.name}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{ padding: '3px 10px', borderRadius: 20, background: planColors[planIdx] + '15', color: planColors[planIdx], fontSize: 11, fontWeight: 600 }}>{plans[planIdx]}</span>
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#374151' }}>{d.max_leads_activos || 5}</td>
                                <td style={{ padding: '14px 16px', fontWeight: 600, color: d.activos >= (d.max_leads_activos || 5) ? '#EF4444' : '#374151' }}>{d.activos}/{d.max_leads_activos || 5}</td>
                                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#059669' }}>{d.cerrados}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: d.active ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${d.active ? '#A7F3D0' : '#FECACA'}`, fontSize: 11, fontWeight: 600, color: d.active ? '#065F46' : '#B91C1C' }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: d.active ? '#10B981' : '#EF4444' }} />
                                    {d.active ? 'Al día' : 'Pendiente'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Pipeline labels usado solo en overview */}
              {section === 'overview' && (
                <div style={{ display: 'none' }}>
                  {Object.entries(STATUS_LABELS_PIPELINE).map(([k, v]) => <span key={k}>{v}</span>)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}