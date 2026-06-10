import { supabase } from '../../../../lib/supabase'

export async function GET() {
  const [leadsRes, despachoRes] = await Promise.all([
    supabase.from('leads').select('*'),
    supabase.from('despachos').select('*'),
  ])

  const leads = leadsRes.data ?? []
  const despachos = despachoRes.data ?? []

  const byCategory = ['Jurídico', 'Inmobiliario', 'Reformas', 'Seguros'].map(cat => ({
    cat,
    total: leads.filter(l => l.category === cat).length,
    won: leads.filter(l => l.category === cat && l.status === 'closed_won').length,
  }))

  const byStatus = Object.entries({
    new: 'Nuevo', assigned: 'Reclamado', contacted: 'Contactado',
    in_progress: 'En progreso', closed_won: 'Cerrado ganado', closed_lost: 'Cerrado perdido'
  }).map(([k, label]) => ({
    status: k, label, count: leads.filter(l => l.status === k).length
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

  return Response.json({
    totals: {
      leads: leads.length,
      nuevos: leads.filter(l => l.status === 'new').length,
      reclamados: leads.filter(l => l.assigned_to).length,
      conversion: leads.length ? Math.round(leads.filter(l => l.status === 'closed_won').length / leads.length * 100) : 0,
      despachos: despachos.length,
      activos: despachos.filter(d => d.active).length,
    },
    byCategory,
    byStatus,
    last7,
    leads: leads.slice(0, 50),
    despachos,
  })
}