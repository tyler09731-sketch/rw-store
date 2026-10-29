import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// GET all crypto methods (for admin + frontend)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('crypto_methods')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ methods: data || [] })
}

// POST: Add a new crypto method
export async function POST(req: Request) {
  const body = await req.json()
  const { password, name, symbol, network, wallet_address, is_recommended, icon_emoji } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // If setting as recommended, un-recommend others
  if (is_recommended) {
    await supabaseAdmin.from('crypto_methods').update({ is_recommended: false }).neq('id', 0)
  }

  const { error } = await supabaseAdmin.from('crypto_methods').insert({
    name, symbol, network, wallet_address, is_recommended: is_recommended || false, icon_emoji: icon_emoji || '💰'
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PUT: Update a crypto method
export async function PUT(req: Request) {
  const body = await req.json()
  const { password, id, name, symbol, network, wallet_address, is_recommended, is_active, icon_emoji } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (is_recommended) {
    await supabaseAdmin.from('crypto_methods').update({ is_recommended: false }).neq('id', id)
  }

  const { error } = await supabaseAdmin.from('crypto_methods').update({
    name, symbol, network, wallet_address, is_recommended, is_active, icon_emoji
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE: Remove a crypto method
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')
  const id = searchParams.get('id')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabaseAdmin.from('crypto_methods').delete().eq('id', id)
  return NextResponse.json({ success: true })
}