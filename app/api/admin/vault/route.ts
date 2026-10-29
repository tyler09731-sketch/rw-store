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

  const { data: payments, error } = await supabaseAdmin
    .from('vault_payments')
    .select('*, users(first_name, username)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payments: payments || [] })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { password, id, action } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'reject') {
    await supabaseAdmin.from('vault_payments').update({ status: 'rejected' }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  // Approve: Get the payment, flag user as seller, mark payment as confirmed
  const { data: payment } = await supabaseAdmin
    .from('vault_payments')
    .select('*')
    .eq('id', id)
    .single()

  if (!payment || payment.status !== 'pending') {
    return NextResponse.json({ error: 'Invalid payment' }, { status: 400 })
  }

  await supabaseAdmin.from('users').update({
    vault_access: true,
    vault_access_paid_at: new Date().toISOString()
  }).eq('telegram_id', payment.user_id)

  await supabaseAdmin.from('vault_payments').update({ status: 'confirmed' }).eq('id', id)

  return NextResponse.json({ success: true })
}