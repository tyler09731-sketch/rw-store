import { Telegraf, Markup } from 'telegraf'
import { NextResponse } from 'next/server'

// Initialize bot with your token
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

// Handle /start command
bot.start((ctx) => {
  const firstName = ctx.from.first_name || 'there'
  
  // Clean welcome message with ONLY the Mini App button
  ctx.reply(
    `👋 Welcome ${firstName}!\n\nThis is the official RW Store. Tap the button below to browse live inventory and purchase securely with Crypto.`,
    Markup.keyboard([
      [Markup.button.webApp('🛒 Open Store', 'https://rw-store-gray.vercel.app/')]
    ]).resize()
  )
})

// Handle /support command
bot.command('support', (ctx) => {
  ctx.reply('Need help? Contact our admin directly: @YourAdminUsername')
})

// Setup webhook route
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

// Vercel needs a GET route to verify it's working
export async function GET() {
  return NextResponse.json({ status: 'Bot is running' })
}