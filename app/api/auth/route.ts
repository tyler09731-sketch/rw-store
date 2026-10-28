import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// We use the Secret key here to bypass RLS and insert/check users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: Request) {
  try {
    const { initData } = await req.json()
    
    if (!initData) {
      return NextResponse.json({ error: 'No initData provided' }, { status: 400 })
    }

    // 1. Parse the initData
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    params.delete('hash')
    
    // 2. Verify the signature (THIS IS CRITICAL FOR SECURITY)
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest()

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (calculatedHash !== hash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 3. Extract user data
    const userJson = params.get('user')
    if (!userJson) return NextResponse.json({ error: 'No user data' }, { status: 400 })
    
    const user = JSON.parse(userJson)

    // 4. Check if user is blocked
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .single()

    if (existingUser?.is_blocked) {
      return NextResponse.json({ error: 'BLOCKED' }, { status: 403 })
    }

    // 5. Register user if they don't exist
    if (!existingUser) {
      await supabaseAdmin.from('users').insert({
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
      })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        first_name: user.first_name,
        username: user.username,
        photo_url: user.photo_url
      } 
    })

  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}