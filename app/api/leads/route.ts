import { supabase } from '../../../lib/supabase'
import { NextRequest } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('leads')
    .select('*, despachos(*)')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data: despachos } = await supabase
    .from('despachos')
    .select('id')
    .contains('categories', [body.category])
    .eq('active', true)

  const shuffled = (despachos || []).sort(() => Math.random() - 0.5).slice(0, 4)
 const assignedIds = shuffled.map((d: { id: string }) => d.id)

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
      status: 'new',
      assigned_despachos: assignedIds,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await supabase.from('lead_events').insert({
    lead_id: leadId,
    type: 'created',
  })

  return Response.json(data, { status: 201 })
}