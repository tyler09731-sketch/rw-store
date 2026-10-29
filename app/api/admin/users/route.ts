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

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: users || [] })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { password, telegram_id, is_blocked, balance, is_vip } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ban / Unban
  if (typeof is_blocked === 'boolean') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_blocked })
      .eq('telegram_id', telegram_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Update Balance
  if (typeof balance === 'number') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ balance })
      .eq('telegram_id', telegram_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // VIP toggle
  if (typeof is_vip === 'boolean') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_vip })
      .eq('telegram_id', telegram_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}