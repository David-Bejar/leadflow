import { supabase } from '../../../../../lib/supabase'
import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Marcar como contactado
  const { error } = await supabase
    .from('lead_empresa')
    .update({ status: 'contacted', updated_at: new Date().toISOString() })
    .eq('lead_id', id)
    .eq('despacho_id', body.despachoId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await supabase.from('lead_events').insert({
    lead_id: id,
    type: 'contacted',
    despacho_id: body.despachoId,
  })

  return Response.json({ success: true })
}