'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const now = Date.now()

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  category: string
  subcategory: string
  location: string
  status: string
  assigned_to: string | null
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
}

type Stats = {
  totals: {
    leads: number
    nuevos: number
    reclamados: number
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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  new:         { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  assigned:    { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
  contacted:   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  in_progress: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  closed_won:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' },
  closed_lost: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', assigned: 'Reclamado', contacted: 'Contactado',
  in_progress: 'En progreso', closed_won: 'Cerrado ganado', closed_lost: 'Cerrado perdido',
}

const CAT_COLORS: Record<string, string> = {
  Jurídico: '#6366F1', Inmobiliario: '#0EA5E9', Reformas: '#F97316', Seguros: '#10B981',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.new
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 600, color: s.text }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
      {STATUS_LABELS[status]}
    </span>
  )
}

function CatBadge({ cat }: { cat: string }) {
  const color = CAT_COLORS[cat] ?? '#6366F1'
  return <span style={{ padding: '2px 10px', borderRadius: 20, background: color + '12', color, fontSize: 11, fontWeight: 600 }}>{cat}</span>
}

const NAV = [
  { id: 'overview', label: 'Resumen', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'leads', label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'despachos', label: 'Despachos', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { id: 'suscripciones', label: 'Suscripciones', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
]

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('overview')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  async function toggleDespacho(id: string, active: boolean) {
    await fetch(`/api/despachos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    })
    const updated = await fetch('/api/admin/stats').then(r => r.json())
    setStats(updated)
  }

  const filteredLeads = (stats?.leads ?? []).filter(l =>
    !search || `${l.name} ${l.email} ${l.location} ${l.category}`.toLowerCase().includes(search.toLowerCase())
  )

  const maxBar = Math.max(...(stats?.last7.map(d => d.count) ?? [1]), 1)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: '#fff', borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, background: '#6366F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', letterSpacing: '-0.3px' }}>LeadFlow</span>
              <span style={{ display: 'block', fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Admin</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px', flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 8 }}>Navegación</p>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: section === item.id ? 600 : 400, background: section === item.id ? '#EEF2FF' : 'transparent', color: section === item.id ? '#6366F1' : '#64748B', marginBottom: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon}/>
              </svg>
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

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
              {NAV.find(n => n.id === section)?.label}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>Panel de administración</span>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: 100, background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9' }} />)}
            </div>
          ) : !stats ? null : (

            <>
              {/* OVERVIEW */}
              {section === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                    {[
                      { label: 'Total leads', val: stats.totals.leads, sub: 'registrados', color: '#6366F1', bg: '#EEF2FF', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                      { label: 'Sin reclamar', val: stats.totals.nuevos, sub: 'pendientes', color: '#F59E0B', bg: '#FFFBEB', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { label: 'Tasa conversión', val: `${stats.totals.conversion}%`, sub: 'leads cerrados', color: '#10B981', bg: '#ECFDF5', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                      { label: 'Despachos activos', val: stats.totals.activos, sub: `de ${stats.totals.despachos} total`, color: '#8B5CF6', bg: '#F5F3FF', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                        <div style={{ width: 40, height: 40, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    {/* Gráfica últimos 7 días */}
                    <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Leads últimos 7 días</h3>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>Nuevas solicitudes por día</p>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                        {stats.last7.map((d, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: d.count > 0 ? '#6366F1' : '#E2E8F0' }}>{d.count}</span>
                            <div style={{ width: '100%', background: d.count > 0 ? '#6366F1' : '#F1F5F9', borderRadius: '4px 4px 0 0', height: `${Math.max((d.count / maxBar) * 80, 4)}px`, transition: 'height 0.3s' }} />
                            <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>{d.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Por categoría */}
                    <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Por categoría</h3>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>Distribución de leads</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {stats.byCategory.map(b => {
                          const color = CAT_COLORS[b.cat] ?? '#6366F1'
                          const pct = stats.totals.leads > 0 ? Math.round((b.total / stats.totals.leads) * 100) : 0
                          return (
                            <div key={b.cat}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{b.cat}</span>
                                <span style={{ fontSize: 13, color: '#64748B' }}>{b.total} leads · {pct}%</span>
                              </div>
                              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Por estado */}
                  <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Pipeline de estados</h3>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>Distribución actual de leads por estado</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
                      {stats.byStatus.map(s => {
                        const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.new
                        return (
                          <div key={s.status} style={{ textAlign: 'center', padding: '16px 8px', background: sc.bg, borderRadius: 10, border: `1px solid ${sc.border}` }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: sc.text, marginBottom: 4 }}>{s.count}</div>
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
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lead..."
                        style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                        onFocus={e => e.target.style.borderColor = '#6366F1'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                            {['ID', 'Nombre', 'Categoría', 'Localización', 'Estado', 'Fecha', ''].map(h => (
                              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
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
                              <td style={{ padding: '12px 16px' }}><StatusBadge status={lead.status} /></td>
                              <td style={{ padding: '12px 16px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{fmtDate(lead.created_at)}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
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
                    <div style={{ width: 340, background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px', flexShrink: 0, height: 'fit-content', position: 'sticky', top: 80 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', fontWeight: 600 }}>{selectedLead.id}</span>
                        <button onClick={() => setSelectedLead(null)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{selectedLead.name}</h3>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                        <CatBadge cat={selectedLead.category} />
                        <StatusBadge status={selectedLead.status} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {[
                          ['Teléfono', selectedLead.phone],
                          ['Email', selectedLead.email],
                          ['Localización', selectedLead.location],
                          ['Subcategoría', selectedLead.subcategory],
                          ['Recibido', fmtDate(selectedLead.created_at)],
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F8FAFC', fontSize: 13 }}>
                            <span style={{ color: '#94A3B8' }}>{label}</span>
                            <span style={{ color: '#0F172A', fontWeight: 500, textAlign: 'right', maxWidth: 180 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                      {selectedLead.description && (
                        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', marginTop: 12, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                          {selectedLead.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* DESPACHOS */}
              {section === 'despachos' && (
                <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {['Despacho', 'Especialidades', 'Localización', 'Usuario', 'Estado', ''].map(h => (
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
                          <td style={{ padding: '14px 16px', color: '#64748B' }}>{d.location}</td>
                          <td style={{ padding: '14px 16px' }}>
                            {d.user_id ? (
                              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Vinculado
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: '#94A3B8' }}>Sin usuario</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: d.active ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${d.active ? '#A7F3D0' : '#E2E8F0'}`, fontSize: 11, fontWeight: 600, color: d.active ? '#065F46' : '#94A3B8' }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: d.active ? '#10B981' : '#CBD5E1' }} />
                              {d.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <button onClick={() => toggleDespacho(d.id, !d.active)}
                              style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 600, color: d.active ? '#EF4444' : '#059669', cursor: 'pointer' }}>
                              {d.active ? 'Desactivar' : 'Activar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUSCRIPCIONES */}
              {section === 'suscripciones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Suscripciones y pagos</h3>
                        <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>Gestión de planes por despacho</p>
                      </div>
                      <span style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                        Próximamente con Stripe
                      </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          {['Despacho', 'Plan', 'Leads este mes', 'Facturación', 'Próximo pago', 'Estado'].map(h => (
                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.despachos.map((d, i) => {
                          const plans = ['Básico', 'Profesional', 'Enterprise']
                          const prices = ['49€/mes', '99€/mes', '199€/mes']
                          const leadsCount = stats.leads.filter(l => l.assigned_to === d.id).length
                          return (
                            <tr key={d.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{d.name}</td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 20, background: '#EEF2FF', color: '#6366F1', fontSize: 11, fontWeight: 600 }}>
                                  {plans[i % 3]}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: '#64748B' }}>{leadsCount} leads</td>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{prices[i % 3]}</td>
                              <td style={{ padding: '14px 16px', color: '#64748B' }}>
                                {new Date(now + (i + 1) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                              </td>
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
                  </div>

                  {/* Resumen ingresos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                    {[
                      { label: 'MRR estimado', val: `${stats.totals.activos * 99}€`, sub: 'ingresos mensuales', color: '#10B981', bg: '#ECFDF5' },
                      { label: 'Leads facturados', val: stats.totals.reclamados, sub: 'leads reclamados', color: '#6366F1', bg: '#EEF2FF' },
                      { label: 'Despachos activos', val: stats.totals.activos, sub: 'con suscripción', color: '#8B5CF6', bg: '#F5F3FF' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
                        <div style={{ fontSize: 30, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}