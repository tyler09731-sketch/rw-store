import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  // Get last 5 confirmed orders, ordered by newest
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('order_ref, price_usd, created_at, products(title), users(first_name, username)')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!orders || orders.length === 0) {
    // Fallback: show a couple of realistic seed strings so the app never looks empty
    return NextResponse.json({
      activities: [
        { text: 'User @rw_**** just purchased a Wescom Log', time: '2 mins ago' },
        { text: 'User @cc_**** just purchased a Visa Platinum', time: '8 mins ago' }
      ]
    })
  }

  const activities = orders.map((o: any) => {
    const name = o.users?.username 
      ? `@${o.users.username.slice(0, 3)}****` 
      : (o.users?.first_name || 'Anonymous')
    const product = o.products?.title || 'item'
    const price = o.price_usd ? `$${Math.floor(o.price_usd)} ` : ''
    return {
      text: `${name} just purchased ${price}${product}`,
      time: timeAgo(o.created_at)
    }
  })

  return NextResponse.json({ activities })
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`
  return `${Math.floor(diff / 86400)} days ago`
}