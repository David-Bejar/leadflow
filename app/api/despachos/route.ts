import { supabase } from '../../../lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')

  let query = supabase.from('despachos').select('*').eq('active', true)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query.order('name')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}