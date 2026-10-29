import { Telegraf, Markup } from 'telegraf'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || 'there'
  const startPayload = ctx.message.text.split(' ')[1]

  let isNewUser = false

  try {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('telegram_id, source')
      .eq('telegram_id', ctx.from.id)
      .single()

    if (existingUser) {
      // Existing user: only update source if they came from a new ad link
      if (startPayload) {
        await supabaseAdmin
          .from('users')
          .update({ source: startPayload })
          .eq('telegram_id', ctx.from.id)
      }
    } else {
      // New user: insert with source
      await supabaseAdmin
        .from('users')
        .insert({ 
          telegram_id: ctx.from.id, 
          first_name: ctx.from.first_name,
          username: ctx.from.username,
          source: startPayload || 'organic'
        })
      isNewUser = true
    }
  } catch (e) {
    console.error('User registration error:', e)
  }

  // Only send full welcome message to NEW users
  if (isNewUser) {
    ctx.reply(
      `🟠 *Welcome to RW Store 2.0, ${firstName}!*\n\nPremium bank logs, CC info, and digital goods. Verified. Secure. Instant.\n\n🔒 Crypto Payments: BTC, USDT (TRC20/BEP20)\n⚡ Live Inventory: Real-time stock\n📦 Instant Delivery: Auto-confirmed\n\nTap the button below to browse the store.`,
      { 
        parse_mode: 'Markdown',
        ...Markup.keyboard([[Markup.button.webApp('🛒 Open Store', 'https://rw-store-gray.vercel.app/')]]).resize()
      }
    )
  } else {
    // Returning user: just ensure the Mini App button is there, no re-welcome
    ctx.reply(
      `Welcome back, ${firstName}. Tap below to continue.`,
      Markup.keyboard([[Markup.button.webApp('🛒 Open Store', 'https://rw-store-gray.vercel.app/')]]).resize()
    )
  }
})

bot.command('support', (ctx) => {
  ctx.reply('Need help? Contact our admin directly: https://t.me/your_support_username')
})

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

export async function GET() {
  return NextResponse.json({ status: 'Bot is running' })
}