import { Telegraf, Markup } from 'telegraf'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

// Initialize Supabase Admin (Secret Key) to save tracking data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || 'there'
  
  // 1. Grab the tracking payload (e.g., "proofs_channel" from "/start proofs_channel")
  const startPayload = ctx.message.text.split(' ')[1]
  
  // 2. Save to database for Admin Tracking
  if (startPayload) {
    try {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('telegram_id')
        .eq('telegram_id', ctx.from.id)
        .single()

      if (existingUser) {
        // Update existing user with new source
        await supabaseAdmin
          .from('users')
          .update({ source: startPayload })
          .eq('telegram_id', ctx.from.id)
      } else {
        // Insert new user with source
        await supabaseAdmin
          .from('users')
          .insert({ 
            telegram_id: ctx.from.id, 
            first_name: ctx.from.first_name,
            username: ctx.from.username,
            source: startPayload 
          })
      }
    } catch (e) {
      console.error('Source tracking error:', e)
    }
  }

  // 3. Send the Premium Welcome Message
  ctx.reply(
    `🟠 Welcome to RW Store 2.0, ${firstName}!\n\nPremium bank logs, CC info, and digital goods. Verified. Secure. Instant.\n\n🔒 Crypto Payments: BTC, USDT (TRC20/BEP20)\n⚡ Live Inventory: Real-time stock\n📦 Instant Delivery: Auto-confirmed\n\nTap the button below to browse the store.`,
    Markup.keyboard([
      [Markup.button.webApp('🛒 Open Store', 'https://rw-store-gray.vercel.app/')]
    ]).resize()
  )
})

// Simple support command
bot.command('support', (ctx) => {
  ctx.reply('Need help? Contact our admin directly: https://t.me/your_support_username')
})

// Webhook Handler for Vercel
export async function POST(req: Request) {
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bot error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'Bot is running' })
}