import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// GET: Check vault access status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('vault_access, is_vip, first_name, username')
    .eq('telegram_id', userId)
    .single()

  // Check if they have a pending payment
  const { data: pendingPayment } = await supabaseAdmin
    .from('vault_payments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single()

  return NextResponse.json({
    unlocked: user?.vault_access === true || user?.is_vip === true,
    isVip: user?.is_vip === true,
    hasVaultAccess: user?.vault_access === true,
    hasPendingPayment: !!pendingPayment,
    firstName: user?.first_name,
    username: user?.username
  })
}

// POST: Submit vault payment (creates a pending request)
export async function POST(req: Request) {
  const body = await req.json()
  const { user_id, tx_hash, crypto_coin } = body

  if (!user_id || !tx_hash) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Check if already pending
  const { data: existing } = await supabaseAdmin
    .from('vault_payments')
    .select('id')
    .eq('user_id', user_id)
    .eq('status', 'pending')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'You already have a pending request. Wait for admin approval.' }, { status: 400 })
  }

  // Create the pending payment
  const { error } = await supabaseAdmin.from('vault_payments').insert({
    user_id,
    amount: 99.00,
    crypto_coin,
    tx_hash,
    status: 'pending'
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, pending: true })
}