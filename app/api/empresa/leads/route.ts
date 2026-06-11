import { supabase } from '../../../../lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const despachoId = request.nextUrl.searchParams.get('despachoId')
  if (!despachoId) return Response.json({ error: 'despachoId requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('lead_empresa')
    .select(`
      *,
      leads (
        id, name, phone, email, category, subcategory,
        location, description, created_at, rgpd
      )
    `)
    .eq('despacho_id', despachoId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}