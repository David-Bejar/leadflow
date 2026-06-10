import { supabase } from '../../../../../lib/supabase'
import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const { data: lead } = await supabase
    .from('leads')
    .select('assigned_to')
    .eq('id', id)
    .single()

  if (lead?.assigned_to) {
    return Response.json({ error: 'Lead ya reclamado' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ assigned_to: body.despachoId, status: 'assigned' })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await supabase.from('lead_events').insert({
    lead_id: id,
    type: 'claimed',
    despacho_id: body.despachoId,
  })

  return Response.json(data)
}