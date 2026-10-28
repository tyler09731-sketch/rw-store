import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, products(title, category, metadata)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: orders || [] })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { password, id, delivery_info } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!id || !delivery_info) {
    return NextResponse.json({ error: 'Missing order ID or delivery info' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ 
      status: 'confirmed', 
      delivery_info: delivery_info 
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}