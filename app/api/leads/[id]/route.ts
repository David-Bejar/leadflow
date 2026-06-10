import { supabase } from '../../../../lib/supabase'
import { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await request.json()

  const { data, error } = await supabase
    .from('leads')
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await supabase.from('lead_events').insert({
    lead_id: id,
    type: body.status,
  })

  return Response.json(data)
}