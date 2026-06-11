import { supabase } from '../../../lib/supabase'
import { NextRequest } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Obtener despachos que coincidan con categoría y estén activos
  const { data: despachos } = await supabase
    .from('despachos')
    .select('id, max_leads_activos')
    .contains('categories', [body.category])
    .eq('active', true)

  if (!despachos || despachos.length === 0) {
    return Response.json({ error: 'No hay empresas disponibles para esta categoría' }, { status: 400 })
  }

  // Filtrar empresas que tengan hueco en su cola
  const disponibles = []
  for (const d of despachos) {
    const { count } = await supabase
      .from('lead_empresa')
      .select('*', { count: 'exact', head: true })
      .eq('despacho_id', d.id)
      .in('status', ['new', 'contacted', 'in_progress'])

    const activos = count ?? 0
    const limite = d.max_leads_activos ?? 5
    if (activos < limite) {
      disponibles.push(d.id)
    }
  }

  const shuffled = disponibles.sort(() => Math.random() - 0.5).slice(0, 4)

  const leadId = 'L' + Math.floor(Math.random() * 9000 + 1000)

  const { data, error } = await supabase
    .from('leads')
    .insert({
      id: leadId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      category: body.category,
      subcategory: body.subcategory,
      location: body.location,
      description: body.description,
      rgpd: body.rgpd,
      ip: body.ip,
      status: 'distributed',
      assigned_despachos: shuffled,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Crear registro en lead_empresa para cada despacho asignado
  if (shuffled.length > 0) {
    await supabase.from('lead_empresa').insert(
      shuffled.map(despachoId => ({
        lead_id: leadId,
        despacho_id: despachoId,
        status: 'new',
      }))
    )
  }

  await supabase.from('lead_events').insert({
    lead_id: leadId,
    type: 'distributed',
  })

  return Response.json(data, { status: 201 })
}