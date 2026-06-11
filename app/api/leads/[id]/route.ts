import { supabase } from '../../../../lib/supabase'
import { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Actualizar estado en lead_empresa para este despacho
  const { error } = await supabase
    .from('lead_empresa')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('lead_id', id)
    .eq('despacho_id', body.despachoId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await supabase.from('lead_events').insert({
    lead_id: id,
    type: body.status,
    despacho_id: body.despachoId,
  })

  return Response.json({ success: true })
}