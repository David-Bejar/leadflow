'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type LeadEmpresa = {
  id: string
  lead_id: string
  despacho_id: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  leads: {
    id: string
    name: string
    phone: string
    email: string
    category: string
    subcategory: string
    location: string
    description: string
    created_at: string
    rgpd: boolean
  }
}

type Despacho = {
  id: string
  name: string
  categories: string[]
  location: string
  max_leads_activos: number
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  new:         { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  contacted:   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  in_progress: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  closed_won:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' },
  closed_lost: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
}

const STATUS_LABELS: Record<string, string> = {
  new:         'Nuevo',
  contacted:   'Contactado',
  in_progress: 'En progreso',
  closed_won:  'Cerrado ganado',
  closed_lost: 'Cerrado perdido',
}

const CAT_COLORS: Record<string, string> = {
  Jurídico:     '#6366F1',
  Inmobiliario: '#0EA5E9',
  Reformas:     '#F97316',
  Seguros:      '#10B981',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.new
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 600, color: s.text }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {STATUS_LABELS[status]}
    </span>
  )
}

function CatBadge({ cat }: { cat: string }) {
  const color = CAT_COLORS[cat] ?? '#6366F1'
  return <span style={{ padding: '2px 10px', borderRadius: 20, background: color + '12', color, fontSize: 12, fontWeight: 600 }}>{cat}</span>
}

export default function PanelEmpresa() {
  const [items, setItems] = useState<LeadEmpresa[]>([])
  const [despacho, setDespacho] = useState<Despacho | null>(null)
  const [currentId, setCurrentId] = useState<string>('')
  const [selected, setSelected] = useState<LeadEmpresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) return

      const res = await fetch(`/api/despachos?userId=${user.id}`)
      const data: Despacho[] = await res.json()
      if (data.length) {
        setDespacho(data[0])
        setCurrentId(data[0].id)
        loadLeads(data[0].id)
      }
    }
    init()
  }, [])

  async function loadLeads(despachoId: string) {
    setLoading(true)
    const res = await fetch(`/api/empresa/leads?despachoId=${despachoId}`)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const filtered = items.filter(item => {
    if (filterStatus && item.status !== filterStatus) return false
    if (search) {
      const lead = item.leads
      if (!`${lead.name} ${lead.email} ${lead.location} ${lead.category}`.toLowerCase().includes(search.toLowerCase())) return false
    }
    return true
  })

  const activos = items.filter(i => ['new', 'contacted', 'in_progress'].includes(i.status)).length
  const limite = despacho?.max_leads_activos ?? 5
  const ganados = items.filter(i => i.status === 'closed_won').length
  const convRate = items.length > 0 ? Math.round((ganados / items.length) * 100) : 0

  async function handleLogout() {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  async function handleStatus(item: LeadEmpresa, status: string) {
    setUpdatingStatus(true)
    await fetch(`/api/leads/${item.lead_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, despachoId: currentId })
    })
    await loadLeads(currentId)
    setSelected(prev => prev ? { ...prev, status } : null)
    setUpdatingStatus(false)
  }

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
            <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', letterSpacing: '-0.3px' }}>LeadFlow</span>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#EEF2FF', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{despacho?.name ?? 'Cargando...'}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{despacho?.location}</div>
            </div>
          </div>

          {/* Cola de leads */}
          <div style={{ marginTop: 12, background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Cola de leads</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: activos >= limite ? '#EF4444' : '#10B981' }}>{activos}/{limite}</span>
            </div>
            <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((activos / limite) * 100, 100)}%`, background: activos >= limite ? '#EF4444' : activos >= limite * 0.8 ? '#F59E0B' : '#10B981', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            {activos >= limite && (
              <p style={{ fontSize: 11, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>Cola llena — cierra leads para recibir nuevos</p>
            )}
          </div>
        </div>

        <div style={{ padding: '12px', flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 8 }}>Estado</p>
          {[{ k: '', label: 'Todos', count: items.length }, ...Object.entries(STATUS_LABELS).map(([k, label]) => ({ k, label, count: items.filter(i => i.status === k).length }))].map(({ k, label, count }) => (
            <button key={k} onClick={() => setFilterStatus(k)}
              style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filterStatus === k ? 600 : 400, background: filterStatus === k ? '#EEF2FF' : 'transparent', color: filterStatus === k ? '#6366F1' : '#64748B', marginBottom: 1 }}>
              <span>{label}</span>
              {count > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: filterStatus === k ? '#6366F1' : '#F1F5F9', color: filterStatus === k ? '#fff' : '#64748B', borderRadius: 10, padding: '1px 7px' }}>{count}</span>}
            </button>
          ))}
        </div>

        {despacho && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Especialidades</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {despacho.categories.map(c => <CatBadge key={c} cat={c} />)}
            </div>
          </div>
        )}

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Panel de leads</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {items.filter(i => i.status === 'new').length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '8px 14px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>{items.filter(i => i.status === 'new').length} lead{items.filter(i => i.status === 'new').length !== 1 ? 's' : ''} nuevo{items.filter(i => i.status === 'new').length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '20px 28px 0', flexShrink: 0 }}>
          {[
            { label: 'Total leads', val: items.length, sub: 'recibidos en total', color: '#6366F1', bg: '#EEF2FF',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
            { label: 'Activos en cola', val: `${activos}/${limite}`, sub: 'leads en gestión', color: activos >= limite ? '#EF4444' : '#F59E0B', bg: activos >= limite ? '#FEF2F2' : '#FFFBEB',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activos >= limite ? '#EF4444' : '#F59E0B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Cerrados ganados', val: ganados, sub: 'casos resueltos', color: '#10B981', bg: '#ECFDF5',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
            { label: 'Tasa conversión', val: `${convRate}%`, sub: 'sobre total recibido', color: '#8B5CF6', bg: '#F5F3FF',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '20px' }}>
              <div style={{ width: 40, height: 40, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email o localización..."
              style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', gap: 16, padding: '16px 28px 24px', overflow: 'hidden', minHeight: 0 }}>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 12, padding: '18px', height: 80 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#94A3B8' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                </svg>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Sin leads disponibles</p>
                <p style={{ fontSize: 13 }}>Los nuevos leads aparecerán aquí automáticamente</p>
              </div>
            ) : filtered.map(item => {
              const lead = item.leads
              const isSelected = selected?.id === item.id
              const catColor = CAT_COLORS[lead.category] ?? '#6366F1'

              return (
                <div key={item.id} onClick={() => setSelected(isSelected ? null : item)}
                  style={{ background: '#fff', border: `1.5px solid ${isSelected ? '#6366F1' : '#F1F5F9'}`, borderLeft: `3px solid ${catColor}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: isSelected ? '0 0 0 3px #6366F115' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>{lead.name}</span>
                        <CatBadge cat={lead.category} />
                        <StatusBadge status={item.status} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {lead.location}
                        </span>
                        <span>{lead.subcategory}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {fmtDateShort(lead.created_at)}
                        </span>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Panel detalle */}
          {selected && (() => {
            const lead = selected.leads
            return (
              <div style={{ width: 360, background: '#fff', border: '1px solid #F1F5F9', borderRadius: 16, overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', fontFamily: 'monospace', marginBottom: 6 }}>{lead.id}</p>
                      <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.3px' }}>{lead.name}</h3>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <CatBadge cat={lead.category} />
                        <StatusBadge status={selected.status} />
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div style={{ padding: '16px 20px', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
                    {[
                      { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>, label: 'Teléfono', value: lead.phone },
                      { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: 'Email', value: lead.email },
                      { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Localización', value: lead.location },
                      { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, label: 'Subcategoría', value: lead.subcategory },
                      { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: 'Recibido', value: fmtDate(lead.created_at) },
                    ].map(({ icon, label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#94A3B8' }}>{icon} {label}</span>
                        <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, textAlign: 'right', maxWidth: 190 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {lead.description && (
                    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descripción</p>
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{lead.description}</p>
                    </div>
                  )}

                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actualizar estado</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {['contacted', 'in_progress', 'closed_won', 'closed_lost'].map(s => {
                        const sc = STATUS_COLORS[s]
                        const isActive = selected.status === s
                        return (
                          <button key={s} onClick={() => handleStatus(selected, s)} disabled={updatingStatus}
                            style={{ padding: '9px 8px', borderRadius: 8, border: `1.5px solid ${isActive ? sc.border : '#E2E8F0'}`, background: isActive ? sc.bg : '#fff', color: isActive ? sc.text : '#64748B', fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: updatingStatus ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                            {STATUS_LABELS[s]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}