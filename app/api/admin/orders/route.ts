import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Telegraf } from 'telegraf'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, products(title, category, delivery_info), users(telegram_id, first_name, username)')
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

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'confirmed', delivery_info })
    .eq('id', id)
    .select('*, users(telegram_id, first_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    if (order && order.users?.telegram_id) {
      await bot.telegram.sendMessage(
        order.users.telegram_id,
        `🎉 *Order Delivered!*\n\nHi ${order.users.first_name || 'there'}, your order *#${order.order_ref}* has been confirmed and delivered.\n\nTap the button below to view your details in the Mini App.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '📦 View Order', web_app: { url: 'https://rw-store-gray.vercel.app/' } }]]
          }
        }
      )
    }
  } catch (e) {
    console.error('Notification error:', e)
  }

  return NextResponse.json({ success: true })
}