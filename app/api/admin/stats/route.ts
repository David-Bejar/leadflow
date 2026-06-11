import { supabase } from '../../../../lib/supabase'

export async function GET() {
  const [leadsRes, despachosRes, leadEmpresaRes] = await Promise.all([
    supabase.from('leads').select('*'),
    supabase.from('despachos').select('*'),
    supabase.from('lead_empresa').select('*'),
  ])

  const leads = leadsRes.data ?? []
  const despachos = despachosRes.data ?? []
  const leadEmpresas = leadEmpresaRes.data ?? []

  const byCategory = ['Jurídico', 'Inmobiliario', 'Reformas', 'Seguros'].map(cat => ({
    cat,
    total: leads.filter(l => l.category === cat).length,
    won: leadEmpresas.filter(le => {
      const lead = leads.find(l => l.id === le.lead_id)
      return lead?.category === cat && le.status === 'closed_won'
    }).length,
  }))

  const byStatus = Object.entries({
    new: 'Nuevo',
    contacted: 'Contactado',
    in_progress: 'En progreso',
    closed_won: 'Cerrado ganado',
    closed_lost: 'Cerrado perdido'
  }).map(([k, label]) => ({
    status: k, label,
    count: leadEmpresas.filter(le => le.status === k).length
  }))

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    return {
      date: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      count: leads.filter(l => l.created_at?.startsWith(dateStr)).length
    }
  })

  const despachosConStats = despachos.map(d => ({
    ...d,
    activos: leadEmpresas.filter(le =>
      le.despacho_id === d.id && ['new', 'contacted', 'in_progress'].includes(le.status)
    ).length,
    total_leads: leadEmpresas.filter(le => le.despacho_id === d.id).length,
    cerrados: leadEmpresas.filter(le =>
      le.despacho_id === d.id && le.status === 'closed_won'
    ).length,
  }))

  return Response.json({
    totals: {
      leads: leads.length,
      nuevos: leads.filter(l => l.status === 'distributed' || l.status === 'new').length,
      gestionados: leadEmpresas.length,
      conversion: leadEmpresas.length ? Math.round(leadEmpresas.filter(le => le.status === 'closed_won').length / leadEmpresas.length * 100) : 0,
      despachos: despachos.length,
      activos: despachos.filter(d => d.active).length,
    },
    byCategory,
    byStatus,
    last7,
    leads: leads.slice(0, 50),
    despachos: despachosConStats,
  })
}