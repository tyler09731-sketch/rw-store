import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// 1. USER: Submit a top-up request
export async function POST(req: Request) {
  const body = await req.json()
  const { user_id, amount, crypto_coin, tx_hash } = body

  if (!user_id || !amount || !crypto_coin || !tx_hash) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('topups').insert({
    user_id,
    amount: parseFloat(amount),
    crypto_coin,
    tx_hash,
    status: 'pending'
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 2. ADMIN: Fetch all pending top-ups
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: topups, error } = await supabaseAdmin
    .from('topups')
    .select('*, users(first_name, username)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ topups: topups || [] })
}

// 3. ADMIN: Approve or reject
export async function PATCH(req: Request) {
  const body = await req.json()
  const { password, id, action } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'reject') {
    await supabaseAdmin.from('topups').update({ status: 'rejected' }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  // Approve: Add to user's balance
  const { data: topup } = await supabaseAdmin
    .from('topups')
    .select('*')
    .eq('id', id)
    .single()

  if (!topup || topup.status !== 'pending') {
    return NextResponse.json({ error: 'Invalid topup' }, { status: 400 })
  }

  // Fetch current balance
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('telegram_id', topup.user_id)
    .single()

  const newBalance = (user?.balance || 0) + topup.amount

  // Update balance and mark topup as confirmed
  await supabaseAdmin.from('users').update({ balance: newBalance }).eq('telegram_id', topup.user_id)
  await supabaseAdmin.from('topups').update({ status: 'confirmed' }).eq('id', id)

  return NextResponse.json({ success: true })
}